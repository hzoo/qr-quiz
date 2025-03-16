import { QRCode } from "@/components/QRCode";
import { QR_COMMANDS } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { useSignal } from "@preact/signals-react";
import { quizState, restartQuiz } from "@/store/quiz";

export function QuizResultsView() {
  useSignals();
  const isResetting = useSignal(false);
  
  // Get data directly from quizState
  const { questions, userAnswers } = quizState.value;
  
  // Calculate correct answers count
  const correctAnswersCount = Object.entries(userAnswers).filter(([questionId]) => {
    const question = questions.find(q => q.id === questionId);
    const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
    return userOption?.isCorrect;
  }).length;
  
  const handleReset = () => {
    isResetting.value = true;
    // Just show reset animation briefly
    setTimeout(() => {
      // Reset immediately
      restartQuiz();
      isResetting.value = false;
    }, 350);
  };
  
  // Get grid classes based on question count
  const getGridClasses = () => {
    const count = questions.length;
    if (count <= 4) return "grid-cols-2 grid-rows-2 gap-3"; 
    if (count <= 8) return "grid-cols-4 grid-rows-2 gap-2";
    if (count <= 12) return "grid-cols-4 grid-rows-3 gap-2";
    return "grid-cols-4 gap-2"; // For 16 questions, don't force grid-rows to allow scrolling
  };
  
  // Get question text size based on question count
  const getQuestionTextSize = () => {
    const count = questions.length;
    if (count <= 4) return "text-4xl";
    if (count <= 8) return "text-3xl";
    if (count <= 12) return "text-2xl";
    return "text-xl";
  };
  
  // Get answer text size based on question count
  const getAnswerTextSize = () => {
    const count = questions.length;
    if (count <= 4) return "text-xl";
    if (count <= 8) return "text-lg";
    return "text-base";
  };
  
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] w-full flex flex-col bg-[#1e1e24] p-4">
      {/* Question Grid - Make it scrollable when many questions */}
      <div className={`grid ${getGridClasses()} overflow-y-auto max-h-[calc(100vh-theme(spacing.56))]`}>
        {questions.map((q, idx) => {
          const userOption = q.options.find(o => o.id === userAnswers[q.id]);
          const correctOption = q.options.find(o => o.isCorrect);
          const isCorrect = userOption?.isCorrect === true;
          
          // Match colors from screenshot
          const bgColor = "bg-[#2b2b33]";
          const borderColor = isCorrect 
            ? "border-emerald-500/50" 
            : (userOption && !isCorrect) 
              ? "border-red-500/50" 
              : "border-[#3d3d47]";
          
          return (
            <div key={q.id} className={`${bgColor} rounded-md border ${borderColor} shadow-md overflow-hidden`}>
              {/* Question number and text */}
              <div className="flex items-start p-2">
                <div className="bg-[#3d3d47] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mr-2">
                  {idx + 1}
                </div>
                <p className={`font-medium ${getQuestionTextSize()}`}>{q.text}</p>
              </div>
              
              {/* Answers */}
              <div className="px-2 pb-2">
                {/* User's incorrect answer */}
                {userOption && !isCorrect && (
                  <div className="flex items-center mb-1">
                    <span className="text-red-400 mr-1">✗</span>
                    <span className={`text-red-400 ${getAnswerTextSize()}`}>{userOption.text}</span>
                  </div>
                )}
                
                {/* User's correct answer */}
                {userOption && isCorrect && (
                  <div className="flex items-center mb-1">
                    <span className="text-emerald-400 mr-1">✓</span>
                    <span className={`text-emerald-400 ${getAnswerTextSize()}`}>{userOption.text}</span>
                  </div>
                )}
                
                {/* Not answered */}
                {!userOption && (
                  <div className={`mb-1 text-red-400 ${getAnswerTextSize()}`}>Not answered</div>
                )}
                
                {/* Correct answer if user was wrong or didn't answer */}
                {(!userOption || !isCorrect) && (
                  <div className="flex items-center">
                    <span className="text-emerald-400 mr-1">✓</span>
                    <span className={`text-emerald-400 ${getAnswerTextSize()}`}>{correctOption?.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Play Again Button and QR Code */}
      <div className="mt-4 flex justify-center flex-col items-center gap-2">
        <div 
          onClick={handleReset}
          className={`bg-white rounded-md transition-all duration-500 border-4 ${
            isResetting.value 
              ? "border-blue-400 shadow-lg shadow-blue-900/20" 
              : "border-white cursor-pointer"
          }`}
        >
          <QRCode 
            size={100}
            value={isResetting.value ? "" : QR_COMMANDS.RESET} 
          />
        </div>
        <button 
          onClick={handleReset} 
          disabled={isResetting.value}
          className={`ml-4 py-2 px-6 rounded-lg font-bold text-lg transition-colors self-center ${
            isResetting.value 
              ? "bg-blue-500 text-white cursor-not-allowed opacity-80" 
              : "bg-[#e9a178] text-[#1e1e24] hover:bg-[#f3b28a] cursor-pointer"
          }`}
        >
          {isResetting.value ? "Resetting..." : "Play Again"}
        </button>
      </div>
    </div>
  );
} 