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
  
  // Determine the styling based on selection and correctness
  let bgColor = "bg-[#3b3b45]";
  let border = "border border-[#86b3d1]/20";
  let shadow = "shadow-md";
  
  if (isSelected) {
    if (isCorrect === true) {
      bgColor = "bg-[#313b34]";
      border = "border border-[#a3c9a8]";
      shadow = "shadow-lg";
    } else if (isCorrect === false) {
      bgColor = "bg-[#3a2f2d]";
      border = "border border-[#d9a295]";
      shadow = "shadow-lg";
    } else {
      bgColor = "bg-[#353542]";
      border = "border border-[#d8b4a0]";
      shadow = "shadow-lg";
    }
  }
  
  return (
    <div 
      className={`p-5 rounded-lg ${bgColor} ${border} ${shadow} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer paper-texture`}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center">
        <div className="text-base font-medium text-[#ebebf0] mb-3 text-center">{option.text}</div>
        
        {/* QR Code with badge */}
        <div className="relative">
          {/* QR Code */}
          <div className="bg-white p-2 rounded-md shadow-sm overflow-hidden scanning">
            <QRCode 
              value={qrValue} 
              size={110} 
            />
          </div>
          
          {/* Option Badge */}
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#e9a178] text-[#2b2b33] flex items-center justify-center text-xs font-bold z-10 shadow-sm">
            {optionLetter}
          </div>
          
          {/* Scan instruction */}
          <div className="absolute -bottom-1 left-0 right-0 text-center bg-opacity-80 py-1 rounded-b text-black">
            <span className="text-xs">scan or tap</span>
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