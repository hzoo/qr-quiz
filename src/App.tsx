import { Quiz } from "@/components/Quiz";
import { BarcodeScannerView } from "./components/Quiz/BarcodeScannerView";

export default function App() {
	return (
		<div className="h-screen flex flex-col overflow-hidden bg-[#2b2b33] paper-texture">
			<BarcodeScannerView />
			<Quiz />
		</div>
	);
}
