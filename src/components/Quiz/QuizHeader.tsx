import { QRCode } from "@/components/QRCode";
import { BarcodeStripes } from "@/components/BarcodeStripes";
import {
	scannerEnabled,
	hideQrCodes,
	helpModalOpen,
	QR_COMMANDS,
	scannerReady,
} from "@/store/uiSignals";
import { connectionStatus, roomCode } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";
import { quizState, isAnswerTransitioning } from "@/store/quiz";

type QuizHeaderProps = {
	title: string;
};

export function QuizHeader({ title }: QuizHeaderProps) {
	useSignals();

	// Get data from quizState
	const { questions, currentQuestionIndex, userAnswers } = quizState.value;

	// Calculate correct answers count
	const correctAnswersCount = Object.entries(userAnswers).filter(
		([questionId]) => {
			const question = questions.find((q) => q.id === questionId);
			const userOption = question?.options.find(
				(o) => o.id === userAnswers[questionId],
			);
			return userOption?.isCorrect;
		},
	).length;

	// Connection status colors
	const statusColors = {
		disconnected: "bg-red-500",
		connecting: "bg-yellow-500",
		connected: "bg-green-500",
	};

	// Event handlers
	const toggleScanner = () => {
		scannerEnabled.value = !scannerEnabled.value;
	};

	const toggleQrCodes = () => {
		hideQrCodes.value = !hideQrCodes.value;
	};

	const openHelpModal = () => {
		helpModalOpen.value = true;
	};

	return (
		<header className="bg-[#2b2b33] border-b-2 border-[#3d3d47] relative z-10">
			{/* Progress bar */}
			<div className="absolute bottom-0 left-0 w-full h-1 bg-[#3d3d47] overflow-hidden">
				{isAnswerTransitioning.value && (
					<div 
						className="h-full bg-[#e9a178] transition-transform duration-1000 ease-linear origin-left"
						style={{ animation: 'progress 1s ease-in-out' }}
					/>
				)}
			</div>

			{/* Add keyframes for the progress animation */}
			<style>{`
				@keyframes progress {
					from { transform: scaleX(0); }
					to { transform: scaleX(1); }
				}
			`}</style>

			{/* Main header with game info */}
			<div className="px-4 py-3 flex items-center justify-between">
				{/* Left side - Game title and progress */}
				<div className="flex items-center gap-3">
					{/* Game title with barcode visual */}
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold text-[#e9a178]">{title}</h1>
						{/* Connection status indicator */}
						<div className="flex items-center gap-1 text-xs">
							<div
								className={`w-2 h-2 rounded-full ${statusColors[connectionStatus.value]}`}
							/>
						</div>

						{/* Room code display */}
						{roomCode.value && (
							<div className="ml-2 px-3 py-1 bg-[#3d3d47] rounded-md border border-[#4d4d57]">
								<span className="text-xs font-semibold tracking-wider text-white opacity-80">
									ROOM
								</span>
								<span className="ml-1 text-sm font-bold text-[#e9a178]">
									{roomCode.value}
								</span>
							</div>
						)}
					</div>

					{/* Question progress with game-like styling */}
					<div className="inline-flex rounded-full px-4 py-1 bg-[#23232b] border border-[#3d3d47] shadow-inner">
						<div className="flex items-center gap-1">
							<span className="text-xs uppercase tracking-wider opacity-80">
								Question
							</span>
							<div className="flex items-center">
								<span className="text-xl font-bold text-[#e9a178]">
									{currentQuestionIndex + 1}
								</span>
								<span className="mx-1 text-gray-400">/</span>
								<span className="text-xl font-bold">{questions.length}</span>
							</div>
						</div>
					</div>

					{/* Score display */}
					<div className="inline-flex rounded-full px-4 py-1 bg-[#23232b] border border-[#3d3d47] shadow-inner">
						<div className="flex items-center gap-1">
							<span className="text-xs uppercase tracking-wider opacity-80">
								Score
							</span>
							<span className="text-xl font-bold text-[#e9a178]">
								{correctAnswersCount}
							</span>
						</div>
					</div>
				</div>

				{/* Right side - Score and scanner status */}
				<div className="flex items-center gap-4">
					{/* Scanner status indicator with toggle */}
					<div className="flex items-center">
						<div
							className={`flex items-center gap-1 px-3 py-1 rounded-full border border-2 ${scannerReady.value ? "bg-[#23232b] border-green-500/50" : "bg-[#23232b] border-yellow-500/50"}`}
						>
							<div
								className={`w-2 h-2 rounded-full ${scannerEnabled.value ? (scannerReady.value ? "bg-green-500" : "bg-yellow-500") : "bg-red-500"}`}
							/>
							<span className="text-xs font-medium">
								{scannerEnabled.value
									? scannerReady.value
										? "Scanner Ready"
										: "Click to Scan"
									: "Scanner Off"}
							</span>
							<button
								onClick={toggleScanner}
								className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center ${scannerEnabled.value ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
								title={
									scannerEnabled.value ? "Disable Scanner" : "Enable Scanner"
								}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="w-3 h-3"
								>
									<path
										d={
											scannerEnabled.value
												? "M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
												: "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
										}
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Hide QR Code Toggle */}
					<button
						onClick={toggleQrCodes}
						className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${hideQrCodes.value ? "bg-purple-700/70 hover:bg-purple-700/90" : "bg-[#3d3d47] hover:bg-[#4d4d57]"}`}
						title={hideQrCodes.value ? "Show QR Codes" : "Hide QR Codes"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className="w-3 h-3"
						>
							<path
								fillRule="evenodd"
								d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z"
								clipRule="evenodd"
							/>
						</svg>
						<span className="hidden sm:inline">
							{hideQrCodes.value ? "Show QR" : "Hide QR"}
						</span>
					</button>

					<div className="group relative" onClick={openHelpModal}>
						<div className="bg-white p-1 rounded-md flex items-center cursor-pointer hover:bg-gray-100 transition-colors">
							<span className="ml-1 text-[#1e1e24] text-xs font-medium px-1">
								HELP
							</span>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
