import { renderSVG } from 'uqr';
import { useEffect, useRef, useState, memo } from 'react';

type QRCodeProps = {
  value: string;
  size?: number;
  label?: string | null;
  className?: string;
};

function QRCodeImpl({ value, size = 150, label = null, className = "" }: QRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (qrRef.current) {
      try {
        qrRef.current.innerHTML = ''; // Clear previous QR code
        const svgString = renderSVG(value);
        qrRef.current.innerHTML = svgString;
        
        // Adjust SVG size - now using 100% of container width
        const svg = qrRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          
          // Remove the viewBox attribute completely to let it scale naturally
          // The QR code generator already provides correct dimensions
          svg.removeAttribute('viewBox');
        }
        
        // Clear any previous errors
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    }
  }, [value]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {error ? (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      ) : (
        <div 
          ref={qrRef} 
          className="bg-white rounded-lg shadow-md w-full h-full aspect-square" 
          style={{ minWidth: `${size}px`, minHeight: `${size}px` }}
        />
      )}
    </div>
  );
}

// Compare function checks if props that affect rendering have changed
function areEqual(prevProps: QRCodeProps, nextProps: QRCodeProps) {
  return (
    prevProps.value === nextProps.value &&
    prevProps.size === nextProps.size
  );
}

// Export memoized component
export const QRCode = memo(QRCodeImpl, areEqual); 