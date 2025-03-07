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

// Question pool management
const questionPoolKey = 'questionPool';
const minPoolSize = 20; // Minimum questions to maintain in the pool

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
  questions: [], // Start with no questions, we'll generate them
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  lastAnswer: null,
  isCorrect: null,
  isLoading: true, // Start in loading state
  error: null,
  userAnswers: {},
};

// Create signals
export const quizState = signal<QuizState>(initialQuizState);
export const geminiModel = signal<string>("gemini-2.0-flash-lite");

// Generate new questions and queue them
export async function generateQuestions(count = 4, isPoolGeneration = false) {
  const currentState = quizState.value;
  
  // Set loading state
  if (!currentState.showResult && !isPoolGeneration) {
    quizState.value = { ...currentState, isLoading: true, error: null };
  }
  
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment.");
    }

    // Check pool first (but skip if we're already generating for pool)
    if (!isPoolGeneration) {
      const pool = loadQuestionPool();
      if (pool.length >= count) {
        const questions = getQuestionsFromPool(count);
        if (currentState.showResult) {
          nextQuestionsQueue.value = questions;
        } else {
          quizState.value = {
            ...quizState.value,
            questions,
            isLoading: false,
          };
        }
        
        // If pool is getting low, generate more in background
        if (pool.length < minPoolSize) {
          generateQuestionsForPool();
        }
        
        return questions;
      }
    }

    // Generate new questions if pool is empty
    const batchSize = Math.max(6, count); // Reduced batch size to avoid truncation
    
    // Interesting prompt for diverse and thought-provoking questions
    const prompt = `Create ${batchSize} genuinely interesting and thought-provoking trivia questions that will surprise and engage users.

Make questions fun, unusual, and thought-provoking - AVOID basic facts that everyone knows.
Include a diverse mix from these categories:
- Theology and philosophy (big questions about existence, religious insights, Christianity, Desert Fathers, OT/NT)
- Art and literature (surprising facts about masterpieces, writers' lives)
- Science (cutting-edge discoveries, counterintuitive findings)
- Technology (inventions that changed history, unusual tech facts)
- Barcode and QR code trivia (since users will be scanning with a barcode scanner)

Each question MUST be:
1. Novel and surprising - something most people wouldn't know
2. Intellectually engaging - makes people think "wow, that's interesting!"
3. Well-structured with 4 plausible options (only ONE correct)

Format as JSON:
[
  {
    "text": "Which philosopher proposed the concept of the 'Übermensch' or 'Superman'?",
    "options": [
      {"text": "Immanuel Kant", "isCorrect": false},
      {"text": "Friedrich Nietzsche", "isCorrect": true},
      {"text": "Jean-Paul Sartre", "isCorrect": false},
      {"text": "Søren Kierkegaard", "isCorrect": false}
    ]
  }
]

IMPORTANT: Return VALID JSON only. No additional text before or after the JSON array.`;

    // Use standard API call without schema configuration
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${geminiModel.value}:generateContent?key=${apiKey}`,
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
            temperature: 0.5, // Lower temperature for more reliable formatting
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
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid API response format");
    }
    
    const content = result.candidates[0].content;
    if (!content.parts || !content.parts[0]) {
      throw new Error("No content parts in API response");
    }
    
    const text = content.parts[0].text.trim();
    let parsedData: Array<{text: string, options: Array<{text: string, isCorrect: boolean}>}>;
    
    // Enhanced JSON parsing with multiple fallback strategies
    try {
      // First attempt: Direct parsing after removing code blocks
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (firstError) {
        console.error('Initial JSON parse failed, trying regex extraction:', firstError);
        
        // Second attempt: Find anything that looks like a JSON array
        const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (secondError) {
            console.error('Regex JSON extraction failed:', secondError);
            
            // Third attempt: Extract and parse complete questions
            try {
              // Look for complete question objects in the JSON
              const completeQuestionsPattern = /\{\s*"text":\s*"[^"]+",\s*"options":\s*\[\s*\{[^}]+\},\s*\{[^}]+\},\s*\{[^}]+\},\s*\{[^}]+\}\s*\]\s*\}/g;
              const questionMatches = cleanedText.match(completeQuestionsPattern);
              
              if (questionMatches && questionMatches.length > 0) {
                // Combine the matches into a valid JSON array
                const reconstructedJson = `[${questionMatches.join(',')}]`;
                try {
                  parsedData = JSON.parse(reconstructedJson);
                  console.log(`Successfully reconstructed ${questionMatches.length} complete questions from truncated JSON`);
                } catch (reconstructError) {
                  console.error('Failed to parse reconstructed questions:', reconstructError);
                  throw new Error('Could not reconstruct valid JSON from fragments');
                }
              } else {
                // Fourth attempt: Aggressive cleanup and repair
                let repaired = cleanedText
                  .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
                  .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
                  .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
                  .replace(/undefined/g, 'null'); // Replace undefined with null
                  
                // Handle truncated JSON by adding closing brackets
                if (!repaired.endsWith(']')) {
                  // Find the last complete question object
                  const lastCompleteObjectMatch = repaired.match(/.*(}]|})[^}\]]*$/);
                  if (lastCompleteObjectMatch) {
                    // Truncate at the last valid closing bracket
                    repaired = repaired.substring(0, lastCompleteObjectMatch.index + lastCompleteObjectMatch[1].length);
                    if (!repaired.endsWith(']')) {
                      repaired = `${repaired}]`;
                    }
                  } else {
                    // If we can't find a good place to cut, just close the brackets
                    repaired = `${repaired.replace(/[^{["]*$/, '')}]}`;
                  }
                }
                  
                // Ensure the text starts with [ and ends with ]
                if (!repaired.startsWith('[')) repaired = `[${repaired}`;
                if (!repaired.endsWith(']')) repaired = `${repaired}]`;
                  
                try {
                  parsedData = JSON.parse(repaired);
                  console.log('Successfully repaired truncated JSON');
                } catch (repairError) {
                  console.error('JSON repair failed:', repairError);
                  throw new Error('All JSON parsing attempts failed');
                }
              }
            } catch (thirdError) {
              console.error('Question extraction failed:', thirdError);
              throw new Error('All JSON parsing attempts failed');
            }
          }
        } else {
          // If we can't find a JSON array, create a minimal valid array with mock data
          console.error('Could not find JSON array in response');
          throw new Error('Could not extract valid JSON from the API response');
        }
      }
    } catch (error) {
      console.error('All JSON parsing attempts failed:', error);
      console.error('API response was:', text);
      
      // Create emergency fallback questions
      const fallbackQuestions = [
        {
          text: "What is the most common barcode format used in retail?",
          options: [
            {text: "QR Code", isCorrect: false},
            {text: "UPC (Universal Product Code)", isCorrect: true},
            {text: "Code 128", isCorrect: false},
            {text: "PDF417", isCorrect: false}
          ]
        },
        {
          text: "Which planet is known as the Red Planet?",
          options: [
            {text: "Venus", isCorrect: false},
            {text: "Jupiter", isCorrect: false},
            {text: "Mars", isCorrect: true},
            {text: "Saturn", isCorrect: false}
          ]
        },
        {
          text: "Who painted the Mona Lisa?",
          options: [
            {text: "Vincent van Gogh", isCorrect: false},
            {text: "Leonardo da Vinci", isCorrect: true},
            {text: "Pablo Picasso", isCorrect: false},
            {text: "Michelangelo", isCorrect: false}
          ]
        },
        {
          text: "What year was the first iPhone released?",
          options: [
            {text: "2005", isCorrect: false},
            {text: "2006", isCorrect: false},
            {text: "2007", isCorrect: true},
            {text: "2008", isCorrect: false}
          ]
        }
      ];
      
      // Use our fallback instead of throwing
      parsedData = fallbackQuestions;
      console.log('Using emergency fallback questions due to JSON parsing failure');
    }
    
    // Validate question format
    const validQuestions = parsedData.filter(q => 
      q?.text && 
      Array.isArray(q?.options) && 
      q?.options.length === 4 &&
      q?.options.filter((o: {isCorrect: boolean}) => o?.isCorrect).length === 1
    );
    
    if (validQuestions.length === 0) {
      throw new Error('No valid questions in the response');
    }
    
    // Map the questions to our format with IDs
    const newQuestions: Question[] = validQuestions.map((q, qIndex) => {
      return {
        id: `q${qIndex}`, // Simple question ID
        text: q.text,
        options: q.options.map((o, oIndex) => {
          // Use letter representations for options (A, B, C, D)
          const optionLetter = String.fromCharCode(65 + oIndex); // A=65, B=66, etc.
          return {
            id: `q${qIndex}_${optionLetter}`, // Simple option ID
            text: o.text,
            isCorrect: o.isCorrect,
          };
        }),
        isDemo: false,
      };
    });
    
    console.log(`Generated ${newQuestions.length} new questions`);
    
    // After generating questions, save extras to pool and use some now
    const questionsForNow = newQuestions.slice(0, count);
    const questionsForPool = newQuestions.slice(count);
    
    if (!isPoolGeneration) {
      const pool = loadQuestionPool();
      // Save to pool, but avoid duplicates based on question text
      const existingTexts = new Set(pool.map(q => q.text));
      const uniquePoolQuestions = questionsForPool.filter(q => !existingTexts.has(q.text));
      
      saveQuestionPool([...uniquePoolQuestions, ...pool]);
      
      // Update state
      if (currentState.showResult) {
        nextQuestionsQueue.value = questionsForNow;
      } else {
        quizState.value = {
          ...quizState.value,
          questions: questionsForNow,
          isLoading: false,
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
          isLoading: false,
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
          isLoading: false,
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
  
  // Move to next question after a shorter delay (800ms instead of 1500ms)
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
  }, 800); // Reduced from 1500ms to 800ms for better pacing
}

// Action to restart the quiz
export async function restartQuiz() {
  // Set loading state
  quizState.value = {
    ...quizState.value,
    isLoading: true,
    error: null,
  };

  try {
    // Force generation of new questions every time
    const newQuestions = await generateQuestions(4);
    
    if (!newQuestions || newQuestions.length === 0) {
      throw new Error("Failed to generate new questions");
    }
    
    // Reset to initial state with new questions
    quizState.value = {
      ...initialQuizState,
      questions: newQuestions,
      isLoading: false,
    };
    
    // Clear the queue
    nextQuestionsQueue.value = [];
  } catch (error) {
    console.error("Error restarting quiz:", error);
    quizState.value = {
      ...quizState.value,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to restart quiz",
    };
  }
}

// Initialize the app with real questions instead of demo questions
export async function initQuiz() {
  // Try to load from the pool first
  const pool = loadQuestionPool();
  if (pool.length >= 4) {
    const questions = getQuestionsFromPool(4);
    quizState.value = {
      ...quizState.value,
      questions,
      isLoading: false,
    };
    
    // If pool is getting low, generate more in background
    if (pool.length < minPoolSize) {
      generateQuestionsForPool();
    }
  } else {
    // Generate initial questions
    try {
      await generateQuestions(4);
    } catch (error) {
      console.error("Error initializing quiz:", error);
      // Fall back to demo questions if generation fails
      quizState.value = {
        ...quizState.value,
        questions: defaultQuestions,
        isLoading: false,
      };
    }
  }
} 