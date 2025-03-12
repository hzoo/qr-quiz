import { memo, useMemo } from "react";

export const BarcodeStripes = memo(() => {
  // Generate random barcode-like stripes
  const barcodeWidths = useMemo(() => 
    Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2), 
  []);
  
  return (
    <div className="flex items-center h-6 space-x-[2px]">
      {barcodeWidths.map((width, index) => (
        <div 
          key={`barcode-stripe-${width.toFixed(4)}-${index}`}
          className="h-6 bg-[#d8b4a0]"
          style={{
            opacity: 0.1 + (width * 0.05),
            width: `${width * 3}px`
          }}
        />
      ))}
    </div>
  );
});

BarcodeStripes.displayName = "BarcodeStripes"; 