import { signal } from "@preact/signals-react";
import type { Question, QuizState, Option } from "@/types";

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

// Check localStorage for saved questions
const loadQuestionsFromStorage = (): Question[] => {
  try {
    const savedQuestions = localStorage.getItem('savedQuestions');
    if (savedQuestions) {
      return JSON.parse(savedQuestions);
    }
  } catch (error) {
    console.error('Error loading questions from localStorage:', error);
  }
  return defaultQuestions;
};

// Save questions to localStorage
const saveQuestionsToStorage = (questions: Question[]) => {
  try {
    localStorage.setItem('savedQuestions', JSON.stringify(questions));
  } catch (error) {
    console.error('Error saving questions to localStorage:', error);
  }
};

// Initial quiz state
const initialQuizState: QuizState = {
  questions: loadQuestionsFromStorage(),
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  lastAnswer: null,
  isCorrect: null,
  isLoading: false,
  error: null,
  userAnswers: {},
};

// Create signals
export const quizState = signal<QuizState>(initialQuizState);
export const geminiModel = signal<string>("gemini-2.0-flash-lite");

// Generate new questions and queue them
export async function generateQuestions(count = 4) {
  // If we're already in results view, generate for next queue
  // Otherwise generate for current quiz (if it's the first run)
  const currentState = quizState.value;
  
  // Set loading state
  if (!currentState.showResult) {
    quizState.value = { ...currentState, isLoading: true, error: null };
  }
  
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment.");
    }

    const prompt = `Generate ${count} creative multiple-choice trivia questions with 4 options each. For each question, exactly one option should be correct.
     
Make questions fun, unusual, and thought-provoking - avoid basic facts that everyone knows. Include questions about theology, art, science, and technology. Feel free to include some barcode trivia since this will be answered using a barcode scanner!

Format the response as a valid JSON array of questions with this exact structure:
[
  {
    "text": "Question text here?",
    "options": [
      {"text": "First option", "isCorrect": false},
      {"text": "Second option", "isCorrect": true},
      {"text": "Third option", "isCorrect": false},
      {"text": "Fourth option", "isCorrect": false}
    ]
  },
  ...more questions
]

Make questions diverse, challenging, and engaging. Each should have one and only one correct answer.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Extract the JSON response from the text
    const content = result.candidates[0].content;
    const text = content.parts[0].text;
    
    // Find and extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the API response");
    }
    
    const jsonString = jsonMatch[0];
    const questionsData = JSON.parse(jsonString);
    
    // Map the questions to our format with IDs
    const newQuestions: Question[] = questionsData.map((q: {text: string, options: Array<{text: string, isCorrect: boolean}>}, qIndex: number) => ({
      id: `q${qIndex + 4}`, // Start from q4 since we have q1-q3 as defaults
      text: q.text,
      options: q.options.map((o, oIndex: number) => ({
        id: `q${qIndex + 4}${String.fromCharCode(97 + oIndex)}`, // a, b, c, d
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      isDemo: false, // These are real questions, not demos
    }));
    
    // Save to localStorage for persistence
    saveQuestionsToStorage(newQuestions);
    
    // If we're on results screen, queue for next quiz
    // Otherwise update the current quiz
    if (currentState.showResult) {
      nextQuestionsQueue.value = newQuestions;
    } else {
      quizState.value = {
        ...quizState.value,
        questions: newQuestions,
        isLoading: false,
      };
    }
    
    return newQuestions;
  } catch (error) {
    console.error("Error generating questions:", error);
    
    // Update error state if not in results view
    if (!currentState.showResult) {
      quizState.value = {
        ...quizState.value,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load questions. Please try again.",
      };
    }
    
    // If API fails, provide fallback questions in development
    if (import.meta.env.DEV) {
      const fallbackQuestions: Question[] = [
        {
          id: "q4", 
          text: "Which of these is NOT a noble gas?",
          options: [
            { id: "q4a", text: "Helium", isCorrect: false },
            { id: "q4b", text: "Nitrogen", isCorrect: true },
            { id: "q4c", text: "Neon", isCorrect: false },
            { id: "q4d", text: "Argon", isCorrect: false },
          ]
        },
        // Add a few more fallback questions
      ];
      
      // Use fallback in dev mode
      if (currentState.showResult) {
        nextQuestionsQueue.value = fallbackQuestions;
      } else {
        quizState.value = {
          ...quizState.value,
          questions: fallbackQuestions,
          isLoading: false,
        };
      }
      
      return fallbackQuestions;
    }
    
    return null;
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
      quizState.value = {
        ...quizState.value,
        showResult: true,
      };
    }
  }, 1500);
}

// Action to restart the quiz
export function restartQuiz() {
  // Check if we have queued questions
  const nextQuestions = nextQuestionsQueue.value.length > 0 
    ? nextQuestionsQueue.value 
    : loadQuestionsFromStorage();
  
  // Reset to initial state with next questions (completely fresh state)
  quizState.value = {
    ...initialQuizState,
    questions: nextQuestions,
    userAnswers: {}, // Completely reset answers
    currentQuestionIndex: 0,
    score: 0,
    showResult: false,
    lastAnswer: null,
    isCorrect: null,
  };
  
  // Clear the queue
  nextQuestionsQueue.value = [];
  
  // We'll handle question generation in the Quiz component to avoid
  // unnecessarily showing the loading indicator when resetting
} 