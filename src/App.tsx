import { memo, useMemo, useEffect } from "react";
import { Quiz } from "@/components/Quiz";
import { QuizSettings } from "@/components/QuizSettings";
import { isRemoteMode, initPartyConnection } from "@/store/partyConnection";
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

	// Initialize PartyKit connection if remote mode is enabled
	useEffect(() => {
		// Check if remote mode was previously enabled (stored in localStorage)
		const savedRemoteMode = localStorage.getItem("remoteMode");
		if (savedRemoteMode === "true") {
			isRemoteMode.value = true;
			initPartyConnection();
		}
	}, []);

	return (
		<div className="h-screen flex flex-col overflow-hidden bg-[#2b2b33] paper-texture">
			{/* More compact header with less vertical space */}
			<header className="pt-2 pb-1 mx-auto text-center barcode-header flex-shrink-0">
				<div className="flex items-center justify-center gap-2">
					<h1 className="text-3xl font-bold text-[#d8b4a0] relative z-10 fade-in">Barcode Quiz</h1>
					<div className="h-6 mx-2">
						<BarcodeStripes />
					</div>
				</div>
				<p className="text-sm text-[#c5c5d1] -mt-1">scan & explore</p>
			</header>
			
			<main>
				<Quiz />
			</main>
			
			{/* Settings panel */}
			<QuizSettings />
			
			{/* Add DevTools - hidden by default, press Alt+D to show */}
			{/* <DevTools /> */}
		</div>
	);
}