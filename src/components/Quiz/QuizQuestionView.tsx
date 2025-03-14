import { QRCodeOption } from "@/components/QRCodeOption";
import { hideQrCodes } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { useComputed, useSignal } from "@preact/signals-react";
import { quizState, answerQuestion } from "@/store/quiz";
import { handleScan } from "@/utils/handleScan";

export function QuizQuestionView() {
  useSignals();
  
  // Add local state to track the selection immediately
  const localSelectedOption = useSignal<string | null>(null);
  
  // Get current question directly from state
  const currentQuestion = quizState.value.questions[quizState.value.currentQuestionIndex];
  
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

  if (!currentQuestion) {
    return null;
  }

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
            
            // Update styling if option is selected - make feedback more obvious
            if (status?.isSelected) {
              borderWidth = "border-4";
              
              if (status.isCorrect === true) {
                // Correct answer - green theme
                bgColor = "bg-emerald-800";
                borderColor = "border-emerald-400";
                labelBg = "bg-emerald-500";
              } else if (status.isCorrect === false) {
                // Incorrect answer - red theme
                bgColor = "bg-red-800";
                borderColor = "border-red-400";
                labelBg = "bg-red-500";
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
                className={`${bgColor} rounded-xl ${borderWidth} ${borderColor} shadow-md overflow-hidden flex flex-row h-full transition-all relative`}
              >
                {/* Text section - taking more width for better layout */}
                <div 
                  className="flex flex-col justify-center w-3/5 p-5 cursor-pointer"
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {/* Option label (A, B, C, D) */}
                  <div className={`${labelBg} text-white font-bold text-2xl w-12 h-12 flex items-center justify-center rounded-full shrink-0 mb-4`}>
                    {optionLabel}
                  </div>
                  
                  {/* Answer text - INCREASED SIZE */}
                  <div className="flex flex-1">
                    <p className="text-xl sm:text-2xl md:text-2xl font-medium leading-tight">{option.text}</p>
                  </div>
                </div>
                
                {/* QR code section - adjusted for better spacing */}
                {!hideQrCodes.value && (
                  <div className="bg-[#23232b] border-l border-[#3d3d47] flex justify-center items-center w-2/5 p-4">
                    <QRCodeOption
                      option={option}
                      onScan={handleOptionSelect}
                      isSelected={status?.isSelected || false}
                      isCorrect={status?.isCorrect}
                      qrSize={160} // Slightly smaller QR size to prevent squishing
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