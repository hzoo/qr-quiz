import { memo } from "react";
import type { Option } from "@/types";
import { QRCode } from "./QRCode";

type QRCodeOptionProps = {
  option: Option;
  onScan: (id: string) => void;
  isSelected?: boolean;
  isCorrect?: boolean | null;
};

// Component implementation
function QRCodeOptionImpl({ 
  option, 
  onScan, 
  isSelected = false, 
  isCorrect = null 
}: QRCodeOptionProps) {
  // Extract just the last part (letter) from the ID for the QR code
  // If format is q0_A, this will extract just "A"
  const simpleScanCode = option.id.split('_').pop() || option.id;
  
  // Get the option letter (A, B, C, D) for display
  const optionLetter = simpleScanCode.toUpperCase();
  
  // Handle manual click (for testing without a scanner)
  const handleClick = () => {
    onScan(option.id);
  };
  
  // Determine background color based on state
  let bgColor = "bg-gradient-to-br from-[#3d3d47] to-[#2b2b33]";
  let border = "border-2 border-[#3d3d47]";
  let shadow = "shadow-md";
  
  if (isSelected) {
    if (isCorrect === true) {
      bgColor = "bg-gradient-to-br from-emerald-600 to-emerald-700";
      border = "border-2 border-emerald-500";
      shadow = "shadow-emerald-900/20";
    } else if (isCorrect === false) {
      bgColor = "bg-gradient-to-br from-red-600 to-red-700";
      border = "border-2 border-red-500";
      shadow = "shadow-red-900/20";
    } else {
      bgColor = "bg-gradient-to-br from-blue-600 to-blue-700";
      border = "border-2 border-blue-500";
      shadow = "shadow-blue-900/20";
    }
  }
  
  return (
    <div
      className={`p-3 sm:p-4 rounded-lg ${bgColor} ${border} ${shadow} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer paper-texture h-full flex flex-col`}
      onClick={handleClick}
    >
      {/* Option text with fixed height */}
      <div className="text-base sm:text-md md:text-xl lg:text-2xl font-medium text-[#ebebf0] mb-3 text-center h-14 md:h-16 flex items-center justify-center">
        <span className="line-clamp-3">{option.text}</span>
      </div>
      
      {/* QR Code Container - with more space for elements */}
      <div className="relative flex-1 flex items-center justify-center pt-1 pb-8">
        <div className="bg-white p-1 sm:p-2 rounded-md w-full max-w-[90%] aspect-square">
          <QRCode value={simpleScanCode} className="w-full h-full" />
        </div>
        
        {/* Badge - positioned consistently */}
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e9a178] text-[#2b2b33] flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
          {optionLetter}
        </div>
        
        {/* Scan text */}
        <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-[#ebebf0]/60">
          scan or tap
        </div>
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
    prevProps.isCorrect === nextProps.isCorrect
  );
}

// Export the memoized version of the component
export const QRCodeOption = memo(QRCodeOptionImpl, areEqual); 