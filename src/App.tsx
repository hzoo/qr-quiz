import { memo, useMemo, useEffect } from "react";
import { Quiz } from "@/components/Quiz";
import { initPartyConnection } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";
// import { DevTools } from "@/components/DevTools";

// Fix the linter error by providing a better key
const BarcodeStripes = memo(() => {
	// Generate random barcode-like stripes
	const barcodeWidths = useMemo(() => 
		Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2), 
	[]);
	
	return (
		<div className="flex items-center h-6 space-x-[2px]">
			{barcodeWidths.map((width, index) => (
				<div 
					key={`barcode-stripe-${width.toFixed(4)}-${index}`} // Using width value in key for uniqueness
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

export default function App() {
	useSignals(); // Enable signals in this component

	// Initialize PartyKit connection
	useEffect(() => {
		// Always initialize PartyKit to handle connections
		initPartyConnection();
	}, []);

	return (
		<div className="h-screen flex flex-col overflow-hidden bg-[#2b2b33] paper-texture">
			{/* Just provide the Quiz component, which will handle all the UI */}
			<Quiz />
			
			{/* <DevTools /> */}
		</div>
	);
}