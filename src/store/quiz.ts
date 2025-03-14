import { signal, effect } from "@preact/signals-react";
import type { Question, QuizState, Option } from "@/types";
import { createPartyKitFetchUrl } from "../utils/url";

// Default questions to show immediately
const defaultQuestions: Question[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    options: [
      { id: "q1a", text: "London", isCorrect: false },
      { id: "q1b", text: "Paris", isCorrect: true },
      { id: "q1c", text: "Berlin", isCorrect: false },
      { id: "q1d", text: "Madrid", isCorrect: false },
    ],
    isDemo: true,
  },
  {
    id: "q2",
    text: "Which planet is known as the Red Planet?",
    options: [
      { id: "q2a", text: "Jupiter", isCorrect: false },
      { id: "q2b", text: "Saturn", isCorrect: false },
      { id: "q2c", text: "Mars", isCorrect: true },
      { id: "q2d", text: "Venus", isCorrect: false },
    ],
    isDemo: true,
  },
  {
    id: "q3",
    text: "What is the largest ocean on Earth?",
    options: [
      { id: "q3a", text: "Atlantic Ocean", isCorrect: false },
      { id: "q3b", text: "Indian Ocean", isCorrect: false },
      { id: "q3c", text: "Arctic Ocean", isCorrect: false },
      { id: "q3d", text: "Pacific Ocean", isCorrect: true },
    ],
    isDemo: true,
  },
  {
    id: "q4",
    text: "Which element has the chemical symbol 'O'?",
    options: [
      { id: "q4a", text: "Gold", isCorrect: false },
      { id: "q4b", text: "Oxygen", isCorrect: true },
      { id: "q4c", text: "Osmium", isCorrect: false },
      { id: "q4d", text: "Oganesson", isCorrect: false },
    ],
    isDemo: true,
  },
];

// Queue for the next set of questions
export const nextQuestionsQueue = signal<Question[]>([]);

// Tracking if generating new questions is in progress
export const isGeneratingNewQuestions = signal(false);

// Flag to indicate if we should queue new questions
export const shouldQueueNewQuestions = signal(false);

// Question pool management
const questionPoolKey = 'questionPool';
const minPoolSize = 20; // Minimum questions to maintain in the pool

// Settings
export const questionsPerQuiz = signal<number>(
  Number.parseInt(localStorage.getItem("questionsPerQuiz") || "10")
);

const loadQuestionPool = (): Question[] => {
  try {
    const saved = localStorage.getItem(questionPoolKey);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading question pool:', error);
    return [];
  }
};

const saveQuestionPool = (questions: Question[]) => {
  try {
    localStorage.setItem(questionPoolKey, JSON.stringify(questions));
  } catch (error) {
    console.error('Error saving question pool:', error);
  }
};

// Get next batch of questions from the pool
const getQuestionsFromPool = (count: number): Question[] => {
  const pool = loadQuestionPool();
  // Shuffle the pool before taking questions
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const questions = shuffledPool.slice(0, count);
  // Remove used questions from pool and save
  saveQuestionPool(shuffledPool.slice(count));
  return questions;
};

// Initial quiz state
const initialQuizState: QuizState = {
  questions: [], // Start empty, we'll fill it right away
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  lastAnswer: null,
  isCorrect: null,
  error: null,
  userAnswers: {},
};

// Create signals with initial pool questions if available
const pool = loadQuestionPool();
export const quizState = signal<QuizState>({
  ...initialQuizState,
  questions: pool.length >= 4 
    ? getQuestionsFromPool(4) 
    : defaultQuestions // Fallback to demo questions only if no pool
});

// If pool is getting low, generate more in background
if (pool.length < minPoolSize) {
  generateQuestionsForPool();
}

export const geminiModel = signal<string>("gemini-2.0-flash");

// Set up reactive effects
// Effect for queuing new questions when at results screen
effect(() => {
  const { showResult } = quizState.value;
  
  if (showResult && nextQuestionsQueue.value.length === 0 && 
      !isGeneratingNewQuestions.value && shouldQueueNewQuestions.value) {
    console.log('Queuing next questions in background');
    isGeneratingNewQuestions.value = true;
    generateQuestions().finally(() => {
      isGeneratingNewQuestions.value = false;
    });
    shouldQueueNewQuestions.value = false;
  }
});

// Effect to set flag to queue new questions when showing results
effect(() => {
  const { showResult } = quizState.value;
  
  if (showResult && nextQuestionsQueue.value.length === 0 && 
      !isGeneratingNewQuestions.value && !shouldQueueNewQuestions.value) {
    console.log('Setting flag to queue new questions');
    shouldQueueNewQuestions.value = true;
  }
});

// Generate new questions and queue them
export async function generateQuestions(count = 4, isPoolGeneration = false) {
  const currentState = quizState.value;
  
  try {
    // Call the backend endpoint: https://ai.google.dev/gemini-api/docs/structured-output?lang=rest
    const response = await fetch(createPartyKitFetchUrl(`/generate?count=${count}`));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate questions');
    }
    
    const result = await response.json();
    if (!result.success || !result.questions) {
      throw new Error('Invalid response from server');
    }
    
    const newQuestions = result.questions;
    console.log(`Generated ${newQuestions.length} new questions`);
    
    // After generating questions, save extras to pool and use some now
    const questionsForNow = newQuestions.slice(0, count);
    const questionsForPool = newQuestions.slice(count);
    
    if (!isPoolGeneration) {
      const pool = loadQuestionPool();
      // Save to pool, but avoid duplicates based on question text
      const existingTexts = new Set(pool.map((q: Question) => q.text));
      const uniquePoolQuestions = questionsForPool.filter((q: Question) => !existingTexts.has(q.text));
      
      saveQuestionPool([...uniquePoolQuestions, ...pool]);
      
      // Update state
      if (currentState.showResult) {
        nextQuestionsQueue.value = questionsForNow;
      } else {
        quizState.value = {
          ...quizState.value,
          questions: questionsForNow,
        };
      }
      
      return questionsForNow;
    }
    
    return newQuestions; // Return all questions for pool generation
  } catch (error) {
    console.error("Error generating questions:", error);
    
    if (!isPoolGeneration) {
      // Update error state if not in results view
      if (!currentState.showResult) {
        quizState.value = {
          ...quizState.value,
          error: error instanceof Error ? error.message : "Failed to load questions. Please try again.",
        };
      }
      
      // Provide fallback questions if we can't generate new ones
      const fallbackQuestions: Question[] = defaultQuestions;
      
      if (currentState.showResult) {
        nextQuestionsQueue.value = fallbackQuestions;
      } else {
        quizState.value = {
          ...quizState.value,
          questions: fallbackQuestions,
        };
      }
      
      return fallbackQuestions;
    }
    
    return null;
  }
}

// Background generation of questions for the pool
async function generateQuestionsForPool() {
  try {
    const result = await generateQuestions(16, true); // Pass true to indicate pool generation
    if (result) {
      const pool = loadQuestionPool();
      saveQuestionPool([...pool, ...result]);
    }
  } catch (error) {
    console.error('Error generating questions for pool:', error);
  }
}

// Action to answer a question
export function answerQuestion(answerId: string) {
  const currentState = quizState.value;
  const currentQuestion = currentState.questions[currentState.currentQuestionIndex];
  const selectedOption = currentQuestion.options.find((option) => option.id === answerId);
  
  if (!selectedOption) return;
  
  const isCorrect = selectedOption.isCorrect;
  const newAnswers = {
    ...currentState.userAnswers,
    [currentQuestion.id]: answerId
  };
  
  // Calculate score based on all correct answers
  const newScore = Object.entries(newAnswers).filter(([questionId]) => {
    const question = currentState.questions.find(q => q.id === questionId);
    const userOption = question?.options.find(o => o.id === newAnswers[questionId]);
    return userOption?.isCorrect;
  }).length;
  
  // Update state with new answer and score
  quizState.value = {
    ...currentState,
    score: newScore,
    lastAnswer: answerId,
    isCorrect,
    userAnswers: newAnswers
  };
  
  // Move to next question after a delay, giving time to see feedback
  setTimeout(() => {
    const nextIndex = currentState.currentQuestionIndex + 1;
    if (nextIndex < currentState.questions.length) {
      quizState.value = {
        ...quizState.value,
        currentQuestionIndex: nextIndex,
        lastAnswer: null,
        isCorrect: null,
      };
    } else {
      quizState.value = {
        ...quizState.value,
        showResult: true,
      };
    }
  }, 1000); // Reduced from 2000ms to 1000ms for a quicker transition
}

export function resetQuizState() {
  // Get questions from pool or use demo questions, just like initial state
  const pool = loadQuestionPool();
  const questions = pool.length >= 4 
    ? getQuestionsFromPool(4) 
    : defaultQuestions;

  // Reset state but with questions
  quizState.value = {
    ...initialQuizState,
    questions, // Always have questions available
  };
  
  // Clear the queue
  nextQuestionsQueue.value = [];
}

export async function generateNewQuestions() {
  try {
    // Generate new questions in background
    const newQuestions = await generateQuestions(4);
    
    if (!newQuestions || newQuestions.length === 0) {
      throw new Error("Failed to generate new questions");
    }
    
    // Update state with new questions
    quizState.value = {
      ...quizState.value,
      questions: newQuestions,
    };
  } catch (error) {
    console.error("Error generating new questions:", error);
    quizState.value = {
      ...quizState.value,
      error: error instanceof Error ? error.message : "Failed to generate new questions",
    };
  }
}

export function restartQuiz() {
  resetQuizState(); // Reset with pool/demo questions immediately
  
  // Only generate new questions if we had to use demo questions
  if (quizState.value.questions.some(q => q.isDemo)) {
    generateNewQuestions(); // Start generating questions in background
  }
}

// Initialize the app with real questions instead of demo questions
export async function initQuiz() {
  // Only generate pool in background if we started with demo questions
  if (quizState.value.questions.some(q => q.isDemo)) {
    generateQuestionsForPool();
  }
} 