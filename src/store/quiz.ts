import { signal, effect } from "@preact/signals-react";
import type { Question, QuizState, Option } from "@/types";
import { createPartyKitFetchUrl } from "../utils/url";
import { roomCode } from "./partyConnection";

// Default questions to show immediately
const defaultQuestions: Question[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    options: [
      { id: "q1_A", text: "London", isCorrect: false },
      { id: "q1_B", text: "Paris", isCorrect: true },
      { id: "q1_C", text: "Berlin", isCorrect: false },
      { id: "q1_D", text: "Madrid", isCorrect: false },
    ],
    isDemo: true,
  },
  {
    id: "q2",
    text: "Which planet is known as the Red Planet?",
    options: [
      { id: "q2_A", text: "Jupiter", isCorrect: false },
      { id: "q2_B", text: "Saturn", isCorrect: false },
      { id: "q2_C", text: "Mars", isCorrect: true },
      { id: "q2_D", text: "Venus", isCorrect: false },
    ],
    isDemo: true,
  },
  {
    id: "q3",
    text: "What is the largest ocean on Earth?",
    options: [
      { id: "q3_A", text: "Atlantic Ocean", isCorrect: false },
      { id: "q3_B", text: "Indian Ocean", isCorrect: false },
      { id: "q3_C", text: "Arctic Ocean", isCorrect: false },
      { id: "q3_D", text: "Pacific Ocean", isCorrect: true },
    ],
    isDemo: true,
  },
  {
    id: "q4",
    text: "Which element has the chemical symbol 'O'?",
    options: [
      { id: "q4_A", text: "Gold", isCorrect: false },
      { id: "q4_B", text: "Oxygen", isCorrect: true },
      { id: "q4_C", text: "Osmium", isCorrect: false },
      { id: "q4_D", text: "Oganesson", isCorrect: false },
    ],
    isDemo: true,
  },
];

// Constants for pool management
const QUESTION_POOL_KEY = 'questionPool';
const MIN_POOL_SIZE = 12; // Minimum number of questions to maintain in the pool
const BATCH_GENERATE_SIZE = 8; // Number of questions to generate at once

// Settings with defaults from localStorage
export const questionsPerQuiz = signal<number>(
  Number.parseInt(localStorage.getItem("questionsPerQuiz") || "10")
);

export const questionsPerRound = signal<number>(
  Number.parseInt(localStorage.getItem("questionsPerRound") || "4")
);

// Save settings when they change
effect(() => {
  localStorage.setItem("questionsPerQuiz", questionsPerQuiz.value.toString());
});

effect(() => {
  localStorage.setItem("questionsPerRound", questionsPerRound.value.toString());
});

// Flag for background generation in progress
export const isGeneratingQuestions = signal(false);

// Question pool signal - initialized from localStorage
export const questionPool = signal<Question[]>((() => {
  try {
    const saved = localStorage.getItem(QUESTION_POOL_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    console.log(`Loaded ${parsed.length} questions from localStorage`);
    return parsed;
  } catch (error) {
    console.error('Error loading question pool from localStorage:', error);
    return [];
  }
})());

// Save the pool to localStorage when needed - helper function
function saveQuestionPoolToLocalStorage() {
  try {
    localStorage.setItem(QUESTION_POOL_KEY, JSON.stringify(questionPool.value));
    console.log(`Saved ${questionPool.value.length} questions to localStorage`);
  } catch (error) {
    console.error('Error saving question pool to localStorage:', error);
  }
}

// Initial quiz state
const initialQuizState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  lastAnswer: null,
  isCorrect: null,
  error: null,
  userAnswers: {},
};

export const quizState = signal<QuizState>(initialQuizState);
export const geminiModel = signal<string>("gemini-2.0-flash");

// Track if we're using demo questions
export const isUsingDemoQuestions = signal<boolean>(false);

// Check pool and generate questions if needed
async function ensurePoolHasEnoughQuestions() {
  // If already generating, don't start another generation
  if (isGeneratingQuestions.value) return;
  
  // If pool has enough questions, we're good
  if (questionPool.value.length >= MIN_POOL_SIZE) return;
  
  console.log(`Question pool low (${questionPool.value.length}/${MIN_POOL_SIZE}), generating more...`);
  
  // Mark as generating
  isGeneratingQuestions.value = true;
  
  try {
    // Determine how many questions to generate
    const generateCount = Math.max(BATCH_GENERATE_SIZE, MIN_POOL_SIZE - questionPool.value.length);
    
    // Generate new questions
    const response = await fetch(createPartyKitFetchUrl(`/generate?count=${generateCount}`, roomCode.value));
    console.log(response);
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
    
    // Filter out questions that are already in the pool to avoid duplicates
    const existingTexts = new Set(questionPool.value.map((q: Question) => q.text));
    const uniqueNewQuestions = newQuestions.filter((q: Question) => !existingTexts.has(q.text));
    
    if (uniqueNewQuestions.length > 0) {
      console.log(`Adding ${uniqueNewQuestions.length} unique questions to pool`);
      
      // Add to the pool - batch the update to reduce localStorage operations
      questionPool.value = [...questionPool.value, ...uniqueNewQuestions];
      // Save the updated pool to localStorage
      saveQuestionPoolToLocalStorage();
    } else {
      console.log('No new unique questions to add to the pool');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
  } finally {
    // Mark as no longer generating
    isGeneratingQuestions.value = false;
  }
}

// Get questions for a new quiz
function getQuestionsForQuiz(count = questionsPerRound.value): Question[] {
  const pool = questionPool.value;
  
  // If pool has enough questions, use them
  if (pool.length >= count) {
    // Shuffle pool and take the first 'count' questions
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const quizQuestions = shuffled.slice(0, count);
    
    // Trigger background refresh if pool is getting low, but don't block
    if (pool.length < MIN_POOL_SIZE) {
      setTimeout(() => ensurePoolHasEnoughQuestions(), 100);
    }
    
    return quizQuestions;
  }
  
  // If pool doesn't have enough, use what we have plus demo questions
  console.log(`Pool only has ${pool.length} questions, using demo questions to fill`);
  
  // Use all remaining pool questions
  const remainingPoolQuestions = [...pool];
  
  // If we don't have enough pool questions, fill with demo questions
  const neededDemoCount = count - remainingPoolQuestions.length;
  const demoQuestionsToUse = defaultQuestions.slice(0, neededDemoCount);
  
  const quizQuestions = [...remainingPoolQuestions, ...demoQuestionsToUse];
  
  // Set flag that we're using demo questions if we actually are
  isUsingDemoQuestions.value = demoQuestionsToUse.length > 0;
  
  // Trigger background refresh but don't block
  setTimeout(() => ensurePoolHasEnoughQuestions(), 100);
  
  return quizQuestions;
}

// Answer a question and update the quiz state
export function answerQuestion(answerId: string) {
  const currentState = quizState.value;
  const currentQuestion = currentState.questions[currentState.currentQuestionIndex];
  const selectedOption = currentQuestion.options.find(option => option.id === answerId);
  
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
  
  // Move to next question after a delay
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
      // User has reached the results screen - now we can remove questions from the pool
      removeCompletedQuestionsFromPool();
      
      quizState.value = {
        ...quizState.value,
        showResult: true,
      };
      
      // If we showed demo questions, trigger background generation
      if (isUsingDemoQuestions.value) {
        ensurePoolHasEnoughQuestions();
      }
    }
  }, 1000);
}

// Remove completed non-demo questions from the pool once quiz is finished
function removeCompletedQuestionsFromPool() {
  const completedQuestions = quizState.value.questions.filter(q => !q.isDemo);
  
  if (completedQuestions.length === 0) return;
  
  // Get the texts of completed questions to remove from pool
  const completedTexts = new Set(completedQuestions.map(q => q.text));
  
  // Keep only questions that weren't in this quiz
  const updatedPool = questionPool.value.filter(q => !completedTexts.has(q.text));
  
  // Only update if there's an actual change
  if (updatedPool.length !== questionPool.value.length) {
    console.log(`Removing ${questionPool.value.length - updatedPool.length} completed questions from pool`);
    questionPool.value = updatedPool;
    saveQuestionPoolToLocalStorage();
  }
}

// Start a new quiz
export function startNewQuiz() {
  const quizQuestions = getQuestionsForQuiz();
  
  quizState.value = {
    questions: quizQuestions,
    currentQuestionIndex: 0,
    score: 0,
    showResult: false,
    lastAnswer: null,
    isCorrect: null,
    error: null,
    userAnswers: {},
  };
}

// Reset and restart quiz
export function restartQuiz() {
  startNewQuiz();
}

// Initialize the quiz 
export async function initQuiz() {
  // If pool is empty or too small, try to generate questions first
  if (questionPool.value.length < questionsPerRound.value && !isGeneratingQuestions.value) {
    await ensurePoolHasEnoughQuestions();
  }
  
  // Start new quiz with whatever questions we have
  startNewQuiz();
} 