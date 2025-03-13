import { QRCodeOption } from "@/components/QRCodeOption";
import { hideQrCodes } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { useComputed, useSignal } from "@preact/signals-react";
import { quizState, answerQuestion } from "@/store/quiz";

export function QuizQuestionView({ handleScan }: { handleScan: (optionId: string) => void }) {
  useSignals();
  
  // Add local state to track the selection immediately
  const localSelectedOption = useSignal<string | null>(null);
  
  // Get current question directly from state
  const currentQuestion = quizState.value.questions[quizState.value.currentQuestionIndex];
  
  if (!currentQuestion) {
    return null;
  }
  
  // Use computed to derive the option status (active, correct, incorrect)
  const optionStatus = useComputed(() => {
    // Get fresh values from the signal each time
    const { lastAnswer, isCorrect } = quizState.value;
    
    return currentQuestion.options.map(option => ({
      id: option.id,
      isSelected: option.id === localSelectedOption.value || option.id === lastAnswer,
      isCorrect: option.id === lastAnswer ? isCorrect : null
    }));
  });

  // Handle option selection with immediate local state update
  const handleOptionSelect = (optionId: string) => {
    // Update local state immediately
    localSelectedOption.value = optionId;
    // Call the parent handler which will eventually update quiz state
    handleScan(optionId);
  };

  return (
    <main className="flex-1 p-4 flex flex-col min-h-0">
      <div className="w-full mx-auto flex-1 flex flex-col max-w-7xl min-h-0">
        {/* Question with larger text for projector visibility */}
        <div className="bg-[#2b2b33] p-6 rounded-lg shadow-md relative mb-4 shrink-0">
          {currentQuestion.isDemo && (
            <div className="absolute top-0 right-0 bg-[#e9a178] text-[#1e1e24] px-2 py-1 text-xs font-medium rounded-tr-lg rounded-bl-lg">
              DEMO
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-center font-medium mb-2 leading-tight">
            {currentQuestion.text}
          </h2>
        </div>
        
        {/* Game-console style answer grid with better visibility */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-auto">
          {currentQuestion.options.map((option, index) => {
            // Use gaming console style labeling (A, B, C, D)
            const optionLabel = String.fromCharCode(65 + index);
            const status = optionStatus.value.find(s => s.id === option.id);
            
            // Determine styling based on selection state - More prominent colors
            let bgColor = "bg-[#2b2b33]";
            let borderColor = "border-[#3d3d47]";
            let borderWidth = "border-2";
            let labelBg = "bg-[#3d3d47]";
            let statusIndicator = null;
            
            // Update styling if option is selected - make feedback more obvious
            if (status?.isSelected) {
              borderWidth = "border-4";
              
              if (status.isCorrect === true) {
                // Correct answer - green theme
                bgColor = "bg-emerald-800";
                borderColor = "border-emerald-400";
                labelBg = "bg-emerald-500";
                statusIndicator = (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-10 ring-2 ring-[#1e1e24]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                  </div>
                );
              } else if (status.isCorrect === false) {
                // Incorrect answer - red theme
                bgColor = "bg-red-800";
                borderColor = "border-red-400";
                labelBg = "bg-red-500";
                statusIndicator = (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-10 ring-2 ring-[#1e1e24]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                );
              } else {
                // Selected but no feedback yet
                bgColor = "bg-[#3d3d47]";
                borderColor = "border-[#e9a178]";
                labelBg = "bg-[#e9a178]";
              }
            }
            
            return (
              <div 
                key={option.id}
                className={`${bgColor} rounded-xl ${borderWidth} ${borderColor} shadow-md overflow-hidden flex flex-col h-full transition-all relative`}
              >
                {/* Status indicator icon (check/x) */}
                {statusIndicator}
                
                {/* Console-style answer layout with prominent label */}
                <div 
                  className="flex flex-1 p-4 cursor-pointer"
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {/* Option label (A, B, C, D) */}
                  <div className={`${labelBg} text-white font-bold text-xl w-10 h-10 flex items-center justify-center rounded-full shrink-0 mr-3`}>
                    {optionLabel}
                  </div>
                  
                  {/* Answer text - larger for visibility */}
                  <div className="flex items-center flex-1">
                    <p className="text-xl sm:text-2xl">{option.text}</p>
                  </div>
                </div>
                
                {/* QR code section (can be hidden) */}
                {!hideQrCodes.value && (
                  <div className="bg-[#23232b] border-t border-[#3d3d47] p-2 flex justify-center">
                    <QRCodeOption
                      option={option}
                      onScan={handleOptionSelect}
                      isSelected={status?.isSelected || false}
                      isCorrect={status?.isCorrect}
                      qrSize={100} // Smaller QR codes since they'll be printed separately
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
} 