import { memo, useMemo, useEffect } from "react";
import { Quiz } from "@/components/Quiz";
import { initPartyConnection } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";
import { QRCode } from "@/components/QRCode";
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
			{/* More compact header with less vertical space */}
			<header className="pt-2 pb-1 mx-auto text-center barcode-header flex-shrink-0">
				<div className="flex items-center justify-center gap-2">
					<h1 className="text-3xl font-bold text-[#d8b4a0] relative z-10 fade-in">Barcode Quiz</h1>
					<div className="h-6 mx-2">
						<BarcodeStripes />
					</div>
				</div>
				<p className="text-sm text-[#c5c5d1] -mt-1">scan & explore</p>
				
				{/* Phone QR code for scanner access */}
				<div className="absolute top-2 right-3 flex items-center">
					<div className="group relative">
						<div 
							className="flex flex-col items-center bg-white p-2 rounded-md hover:scale-105 transition-transform cursor-pointer border-2 border-[#d8b4a0]"
							onClick={() => window.open("https://barcode-fun-party.hzoo.partykit.dev/qr.html", "_blank")}
						>
							<QRCode 
								value="https://barcode-fun-party.hzoo.partykit.dev/qr.html" 
								className="w-12 h-12"
							/>
							<span className="text-[8px] text-[#1e1e24] font-bold mt-1">PHONE SCANNER</span>
						</div>
						<div className="invisible group-hover:visible absolute right-0 top-full mt-2 p-2 bg-[#2b2b33] rounded-md border border-[#3d3d47] shadow-lg text-xs text-[#ebebf0] whitespace-nowrap z-50">
							Scan or click to open<br/>QR scanner on phone
						</div>
					</div>
				</div>
			</header>
			
			<main>
				<Quiz />
			</main>
			
			{/* <DevTools /> */}
		</div>
	);
}