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
    // Use lowercase comparison to handle case insensitivity 
    if (value.toLowerCase().startsWith(QR_COMMANDS.PREFIX.toLowerCase())) {
      // Convert value to lowercase for case-insensitive command matching
      const lowerValue = value.toLowerCase();
      
      // Handle command based on what was scanned
      switch (lowerValue) {
        case QR_COMMANDS.RESET.toLowerCase():
          console.log("Reset command detected");
          restartQuiz();
          break;
        case QR_COMMANDS.CLOSE_HELP.toLowerCase():
          console.log("Close help command detected");
          helpModalOpen.value = false;
          break;
        case QR_COMMANDS.INSTRUCTIONS.toLowerCase():
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