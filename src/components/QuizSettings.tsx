import { questionsPerQuiz, restartQuiz } from "@/store/quiz";
import { isRemoteMode, toggleRemoteMode, connectionStatus } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";

export function QuizSettings() {
  useSignals();
  
  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {/* Questions count settings */}
      <button
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newCount = Number.parseInt(
            prompt("How many questions would you like per quiz? (5-20)", questionsPerQuiz.value.toString()) || 
            questionsPerQuiz.value.toString()
          );
          
          if (!Number.isNaN(newCount) && newCount >= 5 && newCount <= 20) {
            questionsPerQuiz.value = newCount;
            // Save to localStorage for persistence
            localStorage.setItem("questionsPerQuiz", newCount.toString());
            // Restart quiz with new question count
            await restartQuiz();
          } else {
            alert("Please enter a number between 5 and 20");
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>{questionsPerQuiz.value} Questions</span>
      </button>

      {/* Remote mode toggle */}
      <button
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isRemoteMode.value 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => toggleRemoteMode()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </svg>
        <span>
          {isRemoteMode.value 
            ? `Phone Mode ${connectionStatus.value === "connected" ? "✓" : "..."}`
            : "Scanner Mode"
          }
        </span>
      </button>
    </div>
  );
} 