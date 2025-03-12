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
  
  // Generate QR code for reset command
  const resetCommand = useComputed(() => {
    return getQrCodeUrl(QR_COMMANDS.RESET);
  });
  
  return (
    <div className="flex-1 p-4 flex flex-col max-h-[calc(100vh-109px)] overflow-hidden">
      <div className="w-full mx-auto flex-1 flex flex-col max-w-7xl">
        {/* Score display - more game-like */}
        <div className="bg-[#2b2b33] p-6 rounded-lg shadow-md mb-4 text-center border-2 border-[#3d3d47]">
          <h2 className="text-3xl font-bold mb-2">Final Score</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-bold text-[#e9a178]">
              {correctAnswersCount}
            </span>
            <span className="text-2xl text-gray-400">/</span>
            <span className="text-4xl font-bold">{questions.length}</span>
          </div>
          <p className="mt-1 text-lg text-gray-300">
            {correctAnswersCount === questions.length 
              ? "Perfect score! 🎉" 
              : correctAnswersCount > questions.length / 2 
                ? "Well done! 👍" 
                : "Try again! 💪"}
          </p>
        </div>
        
        {/* Game console style layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-100px)]">
          {/* Left panel - QR code */}
          <div className="md:col-span-1 flex flex-col">
            <div className="bg-[#2b2b33] p-4 rounded-lg shadow-md border-2 border-[#3d3d47] h-full flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-center">Play Again</h3>
              <div 
                className="bg-white p-4 rounded-lg mx-auto flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => restartQuiz()}
              >
                <QRCode 
                  size={180}
                  value={resetCommand.value} 
                  className="w-full"
                />
                <div className="mt-2 text-[#1e1e24] font-bold">
                  SCAN TO RESTART
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-400">
                Scan this QR code or tap to start a new quiz
              </div>
            </div>
          </div>
          
          {/* Right panel - Results grid */}
          <div className="md:col-span-2 bg-[#2b2b33] p-4 rounded-lg shadow-md border-2 border-[#3d3d47] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Question Results</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userOption = q.options.find(o => o.id === userAnswers[q.id]);
                const correctOption = q.options.find(o => o.isCorrect);
                const isCorrect = userOption?.isCorrect === true;
                
                // Generate appropriate styling based on answer correctness
                const bgColor = !userOption ? "bg-[#23232b]" : isCorrect ? "bg-emerald-900/20" : "bg-red-900/20";
                const borderColor = !userOption ? "border-[#3d3d47]" : isCorrect ? "border-emerald-500/50" : "border-red-500/50";
                
                return (
                  <div key={q.id} className={`p-4 rounded-lg ${bgColor} border ${borderColor} transition-colors`}>
                    <div className="flex items-start gap-4">
                      {/* Question number badge */}
                      <div className="bg-[#3d3d47] w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        {/* Question text */}
                        <p className="font-medium text-lg mb-2">{q.text}</p>
                        
                        {/* User answer */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base">
                          <span className="opacity-75 shrink-0">Your answer:</span>
                          {userOption ? (
                            <span className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"} flex items-center gap-1`}>
                              {isCorrect && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                              )}
                              {!isCorrect && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                              )}
                              {userOption.text}
                            </span>
                          ) : (
                            <span className="text-red-400 font-medium flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              Not answered
                            </span>
                          )}
                        </div>
                        
                        {/* Correct answer - only show if user got it wrong or didn't answer */}
                        {(!userOption || !userOption.isCorrect) && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 text-base">
                            <span className="opacity-75 shrink-0">Correct answer:</span>
                            <span className="text-emerald-400 font-medium">{correctOption?.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 