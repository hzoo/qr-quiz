import { BarcodeScanner } from "@/components/BarcodeScanner";
import { scannerEnabled, scannerReady } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { handleQrCommand } from "@/utils/qrCommands";
import { handleScan } from "@/utils/handleScan";

export function BarcodeScannerView() {
  useSignals();
  
  // Handle all scan events, including special commands
  const handleScan = (value: string) => {
    console.log("Scanned value:", value);
    
    // Check if it's a command first
    if (handleQrCommand(value)) {
      return;
    }
    
    handleScan(value);
  };
  
  if (!scannerEnabled.value) return null;
  
  return (
    <div className="sr-only">
      <BarcodeScanner 
        onScan={handleScan} 
        onStatusChange={(isReady) => scannerReady.value = isReady}
      />
    </div>
  );
} 