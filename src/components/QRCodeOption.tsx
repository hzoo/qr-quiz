import { memo } from "react";
import type { Option } from "@/types";
import { QRCode } from "./QRCode";
import { useSignals } from "@preact/signals-react/runtime";

type QRCodeOptionProps = {
  option: Option;
  onScan: (id: string) => void;
  isSelected?: boolean;
  isCorrect?: boolean | null;
  hideQrCode?: boolean;
  qrSize?: number;
};

// Component implementation
function QRCodeOptionImpl({ 
  option, 
  onScan, 
  isSelected = false, 
  isCorrect = null,
  hideQrCode = false,
  qrSize = 280
}: QRCodeOptionProps) {
  useSignals();
  
  // Extract just the last part (letter) from the ID for the QR code
  // If format is q0_A, this will extract just "A"
  const simpleScanCode = option.id.split('_').pop() || option.id;
  
  // Get the option letter (A, B, C, D) for display
  const optionLetter = simpleScanCode.toUpperCase();
  
  // Handle manual click (for testing without a scanner)
  const handleClick = () => {
    onScan(option.id);
  };
  
  // Always use the simple option letter for QR code value - simplifies scanning
  const qrValue = optionLetter;

  // For standalone usage (not in the QuizQuestionView)
  if (!hideQrCode) {
    // Determine styling based on selection state
    let borderColor = "border-white";
    let badgeColor = "bg-[#e9a178]";
    let statusIcon = null;
    
    if (isSelected) {
      if (isCorrect === true) {
        // Correct answer styling - more visible
        borderColor = "border-emerald-400";
        badgeColor = "bg-emerald-500";
        statusIcon = (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md z-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
            </svg>
          </div>
        );
      } else if (isCorrect === false) {
        // Incorrect answer styling - more visible
        borderColor = "border-red-400";
        badgeColor = "bg-red-500";
        statusIcon = (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md z-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        );
      }
    }
    
    return (
      <div
        className="rounded-lg cursor-pointer hover:scale-102 transition-transform relative"
        onClick={handleClick}
      >
        {/* QR code with option letter */}
        <div className="relative flex flex-col items-center">
          {statusIcon}
          <div className={`bg-white p-2 rounded-xl shadow-lg border-4 ${borderColor} transition-colors`}>
            <QRCode
              value={qrValue}
              size={qrSize}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // When QR codes are hidden, just show the text content
  // Determine background color based on state
  let bgColor = "bg-gradient-to-br from-[#3d3d47] to-[#2b2b33]";
  let border = "border-2 border-[#3d3d47]";
  let shadow = "shadow-md";
  
  if (isSelected) {
    border = "border-4"; // Thicker border for selected items
    
    if (isCorrect === true) {
      bgColor = "bg-gradient-to-br from-emerald-600 to-emerald-700";
      border = "border-4 border-emerald-400"; // Brighter color for visibility
      shadow = "shadow-emerald-900/20";
    } else if (isCorrect === false) {
      bgColor = "bg-gradient-to-br from-red-600 to-red-700";
      border = "border-4 border-red-400"; // Brighter color for visibility
      shadow = "shadow-red-900/20";
    } else {
      bgColor = "bg-gradient-to-br from-blue-600 to-blue-700";
      border = "border-4 border-blue-500";
      shadow = "shadow-blue-900/20";
    }
  }
  
  return (
    <div
      className={`p-4 rounded-xl ${bgColor} ${border} ${shadow} transition-all cursor-pointer hover:shadow-lg flex items-center justify-between h-full`}
      onClick={handleClick}
    >
      {/* Option text */}
      <div className="flex items-center gap-3">
        <div className="bg-[#e9a178] text-[#1e1e24] font-bold w-10 h-10 flex items-center justify-center rounded-full shrink-0">
          {optionLetter}
        </div>
        <span className="text-xl font-medium text-[#ebebf0]">{option.text}</span>
      </div>
    </div>
  );
}

// Custom comparison function for memo
function areEqual(prevProps: QRCodeOptionProps, nextProps: QRCodeOptionProps) {
  return (
    prevProps.option.id === nextProps.option.id &&
    prevProps.option.text === nextProps.option.text &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isCorrect === nextProps.isCorrect &&
    prevProps.hideQrCode === nextProps.hideQrCode &&
    prevProps.qrSize === nextProps.qrSize
  );
}

// Export the memoized version of the component
export const QRCodeOption = memo(QRCodeOptionImpl, areEqual); 