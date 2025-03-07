import { useEffect, useRef, useState, useCallback, memo } from "react";

type BarcodeScannerProps = {
  onScan: (value: string) => void;
};

function BarcodeScannerImpl({ onScan }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Memoize event handlers
  const handleFocusOut = useCallback(() => setIsFocused(false), []);
  const handleFocusIn = useCallback(() => setIsFocused(true), []);
  
  const handleDocumentClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  // Focus the input element when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // When component unmounts, clear the timeout
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set up document-wide click handler to refocus input
  useEffect(() => {
    // Add a click listener to the entire document
    document.addEventListener("click", handleDocumentClick);

    // Add a focus listener to track focus state
    if (inputRef.current) {
      inputRef.current.addEventListener("blur", handleFocusOut);
      inputRef.current.addEventListener("focus", handleFocusIn);
    }

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      if (inputRef.current) {
        inputRef.current.removeEventListener("blur", handleFocusOut);
        inputRef.current.removeEventListener("focus", handleFocusIn);
      }
    };
  }, [handleDocumentClick, handleFocusOut, handleFocusIn]);

  // Handle barcode input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("handleKeyDown", e.key);
    // Reset timeout on each keypress
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Enter key means the barcode scan is complete
    if (e.key === "Enter") {
      const value = inputRef.current?.value || "";
      if (value.trim()) {
        onScan(value.trim());
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    }

    // Set a timeout to automatically submit after brief pause
    // This helps with some barcode readers that don't always send Enter
    timeoutRef.current = window.setTimeout(() => {
      const value = inputRef.current?.value || "";
      if (value.trim()) {
        onScan(value.trim());
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    }, 300);
  }, [onScan]);

  return (
    <div>
      {/* Hidden input field that captures barcode scans */}
      <input
        ref={inputRef}
        className="opacity-0 absolute -z-10 h-0 w-0"
        type="text"
        onKeyDown={handleKeyDown}
        aria-label="Barcode Scanner Input"
      />
      
      {/* Status indicator */}
      <div className="fixed -bottom-2 right-4 p-3 shadow-md rounded-lg bg-white z-50 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isFocused ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-gray-700">
          {isFocused ? 'Scanner Ready' : 'Click anywhere to activate scanner'}
        </span>
      </div>
    </div>
  );
}

// Only re-render when onScan function reference changes
export const BarcodeScanner = memo(BarcodeScannerImpl); 