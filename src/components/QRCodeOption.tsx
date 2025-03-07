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
      className={`p-3 sm:p-4 md:p-5 rounded-lg ${bgColor} ${border} ${shadow} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer paper-texture w-full h-full`}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center h-full">
        <div className="text-sm sm:text-base font-medium text-[#ebebf0] mb-2 sm:mb-3 text-center">{option.text}</div>
        
        {/* QR Code with badge */}
        <div className="relative w-full flex-1 flex flex-col items-center justify-center">
          {/* QR Code Container */}
          <div className="bg-white p-2 rounded-md shadow-sm overflow-hidden scanning w-full aspect-square">
            <QRCode 
              value={qrValue} 
              size={110}
              className="w-full h-full" 
            />
          </div>
          
          {/* Option Badge */}
          <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e9a178] text-[#2b2b33] flex items-center justify-center text-xs font-bold z-10 shadow-sm">
            {optionLetter}
          </div>
          
          {/* Scan instruction - now below the QR code */}
          <div className="mt-2 text-center text-xs text-[#ebebf0]/60">
            scan or tap
          </div>
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