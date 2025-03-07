import { memo } from "react";
import { Quiz } from "@/components/Quiz";
// import { DevTools } from "@/components/DevTools";

// Memo the barcode stripes since they're static
const BarcodeStripes = memo(() => {
	const barcodeWidths = [2, 4, 1, 5, 3, 6, 1, 4];
	
	return (
		<div className="inline-flex gap-[3px]">
			{barcodeWidths.map((width, index) => (
				<div 
					key={`barcode-${width}-${index}`}
					className="h-7 bg-[#d8b4a0]"
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
	return (
		<div className="min-h-screen bg-[#2b2b33] p-4 paper-texture">
			<header className="max-w-4xl mx-auto mb-8 text-center barcode-header">
				<h1 className="text-4xl font-bold text-[#d8b4a0] mb-3 relative z-10 fade-in">Barcode Quiz</h1>
				<div className="flex justify-center items-center gap-3 mb-5">
					<div className="h-px w-20 bg-[#86b3d1] opacity-50" />
					<p className="text-base text-[#c5c5d1]">scan & explore</p>
					<div className="h-px w-20 bg-[#86b3d1] opacity-50" />
				</div>
				
				<div className="flex justify-center mb-2">
					<BarcodeStripes />
				</div>
			</header>
			
			<main>
				<Quiz />
			</main>
			
			{/* Add DevTools - hidden by default, press Alt+D to show */}
			{/* <DevTools /> */}
		</div>
	);
}