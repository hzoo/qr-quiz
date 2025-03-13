import { restartQuiz } from "@/store/quiz";
import type { Question } from "@/types";
import { useSignals } from "@preact/signals-react/runtime";

// Demo questions to show while loading
const demoQuestions: Question[] = [
  {
    id: "demo1",
    text: "What is the capital of France?",
    options: [
      { id: "demo1a", text: "London", isCorrect: false },
      { id: "demo1b", text: "Paris", isCorrect: true },
      { id: "demo1c", text: "Berlin", isCorrect: false },
      { id: "demo1d", text: "Madrid", isCorrect: false },
    ],
    isDemo: true,
  },
  {
    id: "demo2",
    text: "Which planet is known as the Red Planet?",
    options: [
      { id: "demo2a", text: "Jupiter", isCorrect: false },
      { id: "demo2b", text: "Saturn", isCorrect: false },
      { id: "demo2c", text: "Mars", isCorrect: true },
      { id: "demo2d", text: "Venus", isCorrect: false },
    ],
    isDemo: true,
  },
];

export function QuizLoadingView() {
  useSignals();

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl w-full bg-[#2b2b33] p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Loading Quiz Questions...</h1>
        
        {/* Loading indicator */}
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
        
        <p className="text-center mb-8 text-blue-300">
          Preparing your personalized questions. In the meantime, check out these sample questions:
        </p>
        
        {/* Demo questions preview */}
        <div className="space-y-6 mb-8">
          {demoQuestions.map((question: Question) => (
            <div key={question.id} className="bg-[#1e1e24] p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-yellow-400 mb-1">Demo Question</div>
              <h3 className="font-medium text-lg mb-3">{question.text}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((option) => (
                  <div 
                    key={option.id}
                    className="p-2 bg-gray-800 rounded border border-gray-700 text-sm"
                  >
                    {option.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => restartQuiz()}
          className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          Reload Quiz
        </button>
      </div>
    </div>
  );
} 