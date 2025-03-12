import { restartQuiz } from "@/store/quiz";

export function QuizLoadingView() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl w-full bg-[#2b2b33] p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">No Questions Available</h1>
        <button 
          onClick={() => restartQuiz()}
          className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
        >
          Reload Quiz
        </button>
      </div>
    </div>
  );
} 