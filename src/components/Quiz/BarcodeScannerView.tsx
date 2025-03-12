import { BarcodeScanner } from "@/components/BarcodeScanner";
import { scannerEnabled, helpModalOpen, QR_COMMANDS, scannerReady } from "@/store/uiSignals";
import { useSignals } from "@preact/signals-react/runtime";
import { restartQuiz } from "@/store/quiz";

type BarcodeScannerViewProps = {
  onScan: (value: string) => void;
};

export function BarcodeScannerView({
  onScan,
}: BarcodeScannerViewProps) {
  useSignals();
  
  // Handle all scan events, including special commands
  const handleScan = (value: string) => {
    console.log("Scanned value:", value);
    
    // Check if the scanned value is a special command
    if (value.startsWith(QR_COMMANDS.PREFIX)) {
      // Handle command based on what was scanned
      switch (value) {
        case QR_COMMANDS.RESET:
          console.log("Reset command detected");
          restartQuiz();
          break;
        case QR_COMMANDS.CLOSE_HELP:
          console.log("Close help command detected");
          helpModalOpen.value = false;
          break;
        case QR_COMMANDS.INSTRUCTIONS:
          console.log("Instructions command detected");
          helpModalOpen.value = true;
          break;
        default:
          console.log("Unknown command", value);
      }
      return;
    }
    
    // Not a command - forward to answer handler
    onScan(value);
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