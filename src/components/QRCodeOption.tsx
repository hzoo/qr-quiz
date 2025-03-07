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
  // The QR code will contain the option ID which gets scanned
  const qrValue = option.id;
  
  // Get the option letter (a, b, c, d)
  const optionLetter = option.id.charAt(option.id.length - 1).toUpperCase();
  
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
      className={`p-4 rounded-lg ${bgColor} ${border} ${shadow} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer paper-texture h-full flex flex-col`}
      onClick={handleClick}
    >
      {/* Option text */}
      <div className="text-sm sm:text-base font-medium text-[#ebebf0] mb-3 text-center">{option.text}</div>
      
      {/* QR Code Container - with more space for elements */}
      <div className="relative flex-1 flex items-center justify-center pt-1 pb-8">
        <div className="bg-white p-2 rounded-md w-full max-w-[85%] aspect-square">
          <QRCode value={qrValue} className="w-full h-full" />
        </div>
        
        {/* Badge */}
        <div className="absolute -top-1 right-5 w-6 h-6 rounded-full bg-[#e9a178] text-[#2b2b33] flex items-center justify-center text-sm font-bold shadow-sm">
          {optionLetter}
        </div>
        
        {/* Scan text - moved up slightly */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-[#ebebf0]/60">
          scan or tap
        </div>
      </div>
    </div>
  );
}

// Custom comparison function for memo
// Only re-render if these specific props change
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