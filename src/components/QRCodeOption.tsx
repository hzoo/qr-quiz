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
      className={`p-4 sm:p-6 md:p-8 rounded-xl ${bgColor} ${border} ${shadow} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer paper-texture h-full flex flex-col`}
      onClick={handleClick}
    >
      {/* Option text with fixed height */}
      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-[#ebebf0] mb-4 text-center flex items-center justify-center">
        <span className="line-clamp-3">{option.text}</span>
      </div>
      
      {/* QR Code Container - larger and more prominent */}
      <div className="relative flex-1 flex items-center justify-center pt-2 pb-10">
        {/* Visual corner indicator based on option position */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute w-14 h-14 border-4 rounded-md border-[#e9a178] opacity-70 ${
            optionLetter === 'A' ? 'top-0 left-0 border-r-0 border-b-0' : 
            optionLetter === 'B' ? 'top-0 right-0 border-l-0 border-b-0' : 
            optionLetter === 'C' ? 'bottom-0 left-0 border-r-0 border-t-0' : 
            'bottom-0 right-0 border-l-0 border-t-0'
          }`} />
        </div>
        
        {/* Larger QR code */}
        <div className="bg-white p-3 sm:p-4 rounded-lg w-full max-w-[90%] aspect-square border-4 border-white shadow-lg">
          <QRCode value={simpleScanCode} className="w-full h-full" />
        </div>
        
        {/* Badge - larger and more prominent */}
        <div className="absolute -top-3 -right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#e9a178] text-[#2b2b33] flex items-center justify-center text-lg sm:text-xl font-bold shadow-md ring-2 ring-[#1e1e24]">
          {optionLetter}
        </div>
        
        {/* Scan text - more visible */}
        <div className="absolute bottom-1 left-0 right-0 text-center text-sm text-[#ebebf0]/80 font-medium">
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