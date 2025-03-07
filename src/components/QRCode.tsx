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
        
        // Improve SVG sizing and scaling
        const svg = qrRef.current.querySelector('svg');
        if (svg) {
          // Better approach to preserve QR code proportions while fitting container
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          
          // Instead of removing viewBox, set it to the original QR code dimensions
          // This ensures proper scaling within the container
          const width = svg.getAttribute('width') || '256';
          const height = svg.getAttribute('height') || '256';
          if (!svg.hasAttribute('viewBox')) {
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
          }
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
    <div className={`flex items-center justify-center ${className}`}>
      {error ? (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      ) : (
        <div ref={qrRef} className="w-full h-full flex-1" />
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