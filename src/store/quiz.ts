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

// Initial quiz state
const initialQuizState: QuizState = {
  questions: defaultQuestions,
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  lastAnswer: null,
  isCorrect: null,
  isLoading: false,
  error: null,
};

// Create signals
export const quizState = signal<QuizState>(initialQuizState);
export const geminiModel = signal<string>("gemini-2.0-flash-lite");

// Gemini API call to generate questions
export async function generateQuestions(count = 4) {
  try {
    // Set loading flag but keep current questions
    quizState.value = {
      ...quizState.value,
      isLoading: true,
      error: null,
    };

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment.");
    }

    const prompt = `Generate ${count} creative multiple-choice trivia questions with 4 options each. For each question, exactly one option should be correct.
    
Make questions fun, unusual, and thought-provoking - avoid basic facts that everyone knows. Include questions about music, art, science, obscure history, and pop culture.

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
      id: `q${qIndex + 1}`,
      text: q.text,
      options: q.options.map((o, oIndex: number) => ({
        id: `q${qIndex + 1}${String.fromCharCode(97 + oIndex)}`, // a, b, c, d
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      isDemo: false, // These are real questions, not demos
    }));

    // Update with the new questions but preserve other state
    quizState.value = {
      ...quizState.value,
      questions: newQuestions,
      isLoading: false,
      // Only reset the index if we're not already in a quiz
      currentQuestionIndex: quizState.value.showResult ? 0 : quizState.value.currentQuestionIndex,
    };

    return newQuestions;
  } catch (error) {
    console.error("Error generating questions:", error);
    
    quizState.value = {
      ...quizState.value,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error generating questions",
    };
    
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
  
  quizState.value = {
    ...currentState,
    score: isCorrect ? currentState.score + 1 : currentState.score,
    lastAnswer: answerId,
    isCorrect,
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
  // Reset to initial state and generate new questions
  quizState.value = {
    ...initialQuizState,
    questions: defaultQuestions, // Start with default questions
  };
  
  // Generate new questions in the background
  generateQuestions();
} 