import { useEffect, useRef, useState, useCallback, memo } from "react";

type BarcodeScannerProps = {
  onScan: (value: string) => void;
  onStatusChange?: (isReady: boolean) => void; // Optional callback for scan status
};

function BarcodeScannerImpl({ onScan, onStatusChange }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Update the focus state and callback
  const updateFocusState = useCallback((focused: boolean) => {
    setIsFocused(focused);
    // Notify parent component about status change if callback provided
    if (onStatusChange) {
      onStatusChange(focused);
    }
  }, [onStatusChange]);

  // Memoize event handlers
  const handleFocusOut = useCallback(() => updateFocusState(false), [updateFocusState]);
  const handleFocusIn = useCallback(() => updateFocusState(true), [updateFocusState]);
  
  const handleDocumentClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      updateFocusState(true);
    }
  }, [updateFocusState]);

  // Focus the input element when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Initialize status
      updateFocusState(true);
    }

    // When component unmounts, clear the timeout
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [updateFocusState]);

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
    console.log("key", e.key);
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
      
      {/* No status indicator - moved to parent component */}
    </div>
  );
}

// Custom comparison function for memo
function areEqual(prevProps: BarcodeScannerProps, nextProps: BarcodeScannerProps) {
  return (
    prevProps.onScan === nextProps.onScan && 
    prevProps.onStatusChange === nextProps.onStatusChange
  );
}

// Export the memoized version of the component
export const BarcodeScanner = memo(BarcodeScannerImpl, areEqual); 