import { QRCode } from "@/components/QRCode";
import type { Question } from "@/types";
import { getQrCodeUrl } from "@/store/partyConnection";
import { QR_COMMANDS } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { useComputed } from "@preact/signals-react";
import { quizState, restartQuiz } from "@/store/quiz";

export function QuizResultsView() {
  useSignals();
  
  // Get data directly from quizState
  const { questions, userAnswers } = quizState.value;
  
  // Calculate correct answers count
  const correctAnswersCount = Object.entries(userAnswers).filter(([questionId]) => {
    const question = questions.find(q => q.id === questionId);
    const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
    return userOption?.isCorrect;
  }).length;
  
  return (
    <div className="h-[calc(100vh-112px)] w-full flex bg-[#1e1e24]">
      {/* Left side: Question Results */}
      <div className="w-2/3 flex flex-col min-h-0 p-1 overflow-hidden">
        <h2 className="text-xl font-bold p-2 text-[#e9a178]">Question Results</h2>
        <div className="overflow-auto flex-1 grid grid-cols-1 gap-1 p-1">
          {questions.map((q, idx) => {
            const userOption = q.options.find(o => o.id === userAnswers[q.id]);
            const correctOption = q.options.find(o => o.isCorrect);
            const isCorrect = userOption?.isCorrect === true;
            
            const bgColor = !userOption ? "bg-[#23232b]" : isCorrect ? "bg-emerald-900/20" : "bg-red-900/20";
            const borderColor = !userOption ? "border-[#3d3d47]" : isCorrect ? "border-emerald-500/50" : "border-red-500/50";
            
            return (
              <div key={q.id} className="bg-[#2b2b33] p-2 rounded-md shadow-md border border-[#3d3d47]">
                <div className={`p-2.5 rounded-md ${bgColor} border ${borderColor} transition-colors flex`}>
                  <div className="flex items-start gap-2 w-full">
                    {/* Question number badge */}
                    <div className="bg-[#3d3d47] w-7 h-7 rounded-full flex items-center justify-center text-base font-bold shrink-0">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Question text */}
                      <p className="font-medium text-2xl mb-2 line-clamp-2 flex-1">{q.text}</p>
                      
                      {/* User answer */}
                      <div className="flex flex-col text-base w-full gap-1">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="opacity-75 shrink-0 text-sm">Your:</span>
                          {userOption ? (
                            <span className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"} flex items-center gap-1 truncate flex-1`}>
                              {isCorrect ? "✓" : "✗"} {userOption.text}
                            </span>
                          ) : (
                            <span className="text-red-400 font-medium flex items-center gap-1 flex-1">
                              Not answered
                            </span>
                          )}
                        </div>
                        
                        {/* Correct answer - only show if user got it wrong or didn't answer */}
                        {(!userOption || !userOption.isCorrect) && (
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="opacity-75 shrink-0 text-sm">Correct:</span>
                            <span className="text-emerald-400 font-medium truncate text-base flex-1">{correctOption?.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right side: Score and QR Code */}
      <div className="w-1/3 flex flex-col p-1 gap-4">
        {/* Score display */}
        <div className="bg-[#2b2b33] p-4 rounded-md shadow-md border border-[#3d3d47]">
          <h2 className="text-xl font-bold mb-3 text-center">Final Score</h2>
          <div className="flex justify-center items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold text-[#e9a178]">{correctAnswersCount}</span>
            <span className="text-xl text-gray-400">/</span>
            <span className="text-3xl font-bold">{questions.length}</span>
          </div>
          <p className="text-center text-xl text-gray-300">
            {correctAnswersCount === questions.length 
              ? "Perfect! 🎉" 
              : correctAnswersCount > questions.length / 2 
                ? "Well done! 👍" 
                : "Try again! 💪"}
          </p>
        </div>

        {/* QR code for reset */}
        <div className="bg-[#2b2b33] p-4 rounded-md shadow-md border border-[#3d3d47] flex flex-col items-center">
          <div 
            className="bg-white p-3 rounded-md cursor-pointer hover:scale-105 transition-transform mb-4"
            onClick={() => restartQuiz()}
          >
            <QRCode 
              size={140}
              value={QR_COMMANDS.RESET} 
              className="w-[140px]"
            />
          </div>
          <button 
            onClick={() => restartQuiz()} 
            className="bg-[#e9a178] text-[#1e1e24] py-3 px-6 rounded-lg font-bold text-xl hover:bg-[#f3b28a] transition-colors w-full text-center"
          >
            Play Again
          </button>
          <div className="text-sm text-gray-400 mt-2 text-center">Scan QR or tap button</div>
        </div>
      </div>
    </div>
  );
} 