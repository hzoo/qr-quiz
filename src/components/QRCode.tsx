import { renderSVG } from 'uqr';
import { useEffect, useRef, useState, memo } from 'react';

type QRCodeProps = {
  value: string;
  size?: number;
  label?: string | null;
};

function QRCodeImpl({ value, size = 150, label = null }: QRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (qrRef.current) {
      try {
        qrRef.current.innerHTML = ''; // Clear previous QR code
        const svgString = renderSVG(value);
        qrRef.current.innerHTML = svgString;
        
        // Adjust SVG size
        const svg = qrRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', `${size}px`);
          svg.setAttribute('height', `${size}px`);
        }
        
        // Clear any previous errors
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      ) : (
        <div ref={qrRef} className="p-3 bg-white rounded-lg shadow-md" />
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