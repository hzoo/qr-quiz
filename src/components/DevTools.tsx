import { useEffect, useState } from "react";

// This is a development-only component to help test the app
// without needing a physical barcode scanner
export function DevTools() {
  const [showControls, setShowControls] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [scanDelay, setScanDelay] = useState(5); // seconds

  // Toggle dev controls with Alt+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyD") {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Simulate barcode scans when test mode is active
  useEffect(() => {
    if (!testMode) return;
    
    const interval = setInterval(() => {
      // Generate a random option ID in the format q#a, q#b, q#c, or q#d
      const questionNum = Math.floor(Math.random() * 4) + 1; // 1-4
      const optionLetter = String.fromCharCode(97 + Math.floor(Math.random() * 4)); // a-d
      const optionId = `q${questionNum}${optionLetter}`;
      
      // Create a synthetic input event
      const input = document.querySelector('input[aria-label="Barcode Scanner Input"]') as HTMLInputElement;
      
      if (input) {
        // Set the value
        input.value = optionId;
        
        // Trigger an Enter key event
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
        });
        
        input.dispatchEvent(enterEvent);
        
        console.log("Simulated barcode scan:", optionId);
      }
    }, scanDelay * 1000);
    
    return () => clearInterval(interval);
  }, [testMode, scanDelay]);

  if (!showControls) return null;

  return (
    <div className="fixed top-4 right-4 p-4 bg-white shadow-lg rounded-lg z-50 border-2 border-gray-200">
      <h3 className="text-sm font-bold mb-2">DevTools (press Alt+D to hide)</h3>
      
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="testMode"
          checked={testMode}
          onChange={(e) => setTestMode(e.target.checked)}
        />
        <label htmlFor="testMode" className="text-sm">Auto-scan test mode</label>
      </div>
      
      {testMode && (
        <div className="flex items-center gap-2">
          <label htmlFor="scanDelay" className="text-sm">Scan every</label>
          <input
            type="range"
            id="scanDelay"
            min="1"
            max="10"
            value={scanDelay}
            onChange={(e) => setScanDelay(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm">{scanDelay}s</span>
        </div>
      )}
    </div>
  );
} 