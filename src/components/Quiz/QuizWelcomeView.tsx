import { useSignals, useSignal } from "@preact/signals-react/runtime";
import { useEffect } from "react";
import { QRCode } from "@/components/QRCode";
import { BarcodeStripes } from "@/components/BarcodeStripes";
import {
	initPartyConnection,
	joinRoom,
	roomCode,
	connectionStatus,
} from "@/store/partyConnection";
import { QR_COMMANDS, scannerEnabled } from "@/store/uiSignals";
import { initQuiz } from "@/store/quiz";
import { quizStarted } from "@/store/quiz";

export function QuizWelcomeView() {
	useSignals();
	const customRoomCode = useSignal("");
	const isJoining = useSignal(false);

	// Generate a random room code when component mounts if not already connected
	useEffect(() => {
		// First check URL for room code parameter
		const urlParams = new URLSearchParams(window.location.search);
		const roomParam = urlParams.get("room");

		if (roomParam && roomParam.length === 4) {
			// If room code is in URL, join that room
			joinRoom(roomParam);
		} else if (connectionStatus.value === "disconnected" && !roomCode.value) {
			// Otherwise generate a new room code
			initPartyConnection();
		}

		// Clean up URL parameter after processing it
		if (roomParam) {
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete("room");
			window.history.replaceState({}, document.title, newUrl.toString());
		}
	}, []);

	// Handle room code input change
	const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Convert to uppercase and limit to 4 characters
		const value = e.target.value
			.toUpperCase()
			.replace(/[^A-Z]/g, "")
			.slice(0, 4);
		customRoomCode.value = value;
	};

	// Join a custom room
	const handleJoinRoom = () => {
		if (customRoomCode.value.length === 4) {
			isJoining.value = true;
			joinRoom(customRoomCode.value);
			setTimeout(() => (isJoining.value = false), 1000);
		}
	};

	// Create a new random room
	const handleCreateNewRoom = () => {
		isJoining.value = true;
		initPartyConnection();
		setTimeout(() => (isJoining.value = false), 1000);
	};

	// Start the quiz
	const handleStartQuiz = () => {
		if (connectionStatus.value === "connected") {
			scannerEnabled.value = true;
			initQuiz();
			quizStarted.value = true;
		}
	};

	// Connection status colors
	const statusColors = {
		disconnected: "bg-red-500",
		connecting: "bg-yellow-500",
		connected: "bg-green-500",
	};

	return (
		<div className="flex flex-col items-center justify-center h-full p-8 max-w-6xl mx-auto">
			{/* Title with barcode styling */}
			<div className="mb-8 text-center">
				<div className="flex items-center justify-center gap-2 mb-2">
					<BarcodeStripes className="h-10 w-14" />
					<h1 className="text-4xl font-bold text-[#e9a178]">Barcode Quiz</h1>
					<BarcodeStripes className="h-10 w-14" />
				</div>
        <p className="text-gray-300">with henry zhu</p>
				<p className="text-xl text-gray-300 pt-6">
					control everything with QR codes
				</p>
			</div>

			{/* Room information and connection status */}
			<div className="flex items-center justify-center mb-8 gap-4">
				<div className="flex items-center gap-2 px-4 py-2 bg-[#2b2b33] border border-[#3d3d47] rounded-lg">
					<div className="flex items-center gap-1">
						<div
							className={`w-3 h-3 rounded-full ${statusColors[connectionStatus.value]}`}
						/>
						<span className="text-sm">
							{connectionStatus.value === "connected"
								? "Connected"
								: connectionStatus.value === "connecting"
									? "Connecting..."
									: "Disconnected"}
						</span>
					</div>
				</div>

				{roomCode.value && (
					<div className="px-4 py-2 bg-[#2b2b33] border border-[#3d3d47] rounded-lg">
						<span className="text-sm font-semibold text-gray-300">
							ROOM CODE
						</span>
						<span className="ml-2 text-xl font-bold text-[#e9a178]">
							{roomCode.value}
						</span>
					</div>
				)}
			</div>

			{/* Main content grid: Instructions + Room joining */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
				{/* Left side: Instructions */}
				<div className="bg-[#2b2b33] border border-[#3d3d47] rounded-lg p-6 flex flex-col">
					<h2 className="text-xl font-bold text-[#e9a178] mb-4">How to Play</h2>

					<ol className="space-y-4 text-gray-300 flex-1">
						<li className="flex items-start gap-2">
							<span className="bg-[#e9a178] text-[#2b2b33] rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">
								1
							</span>
							<span>
								Players use their phone cameras to scan QR codes to answer
								questions
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="bg-[#e9a178] text-[#2b2b33] rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">
								2
							</span>
							<span>Answer correctly to score points and win the game!</span>
						</li>
					</ol>

					{/* Help QR code */}
					<div className="mt-6 flex items-center justify-center">
						<div className="p-3 bg-white rounded-md">
							<QRCode
								value={`${window.location.origin}/qr.html${roomCode.value ? `?room=${roomCode.value}` : ""}`}
								size={230}
							/>
						</div>
					</div>

					<div className="flex flex-col text-gray-300 items-center mt-3">
						<div className="flex items-center gap-2">
							<span className="text-[#e9a178] text-xl">📱</span>
							<p>Use your phone's camera to scan QR codes</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-[#e9a178] text-xl">🔍</span>
							<p>Or use a dedicated barcode scanner</p>
						</div>
						<p className="text-sm text-gray-400 mt-2">
							Scan this QR code for detailed instructions!
						</p>
					</div>
				</div>

				{/* Right side: Room options */}
				<div className="bg-[#2b2b33] border border-[#3d3d47] rounded-lg p-6 flex flex-col">
					{/* <h2 className="text-xl font-bold text-[#e9a178] mb-4">Join or Create Room</h2>
          
          {roomCode.value && (
            <div className="mb-4 p-3 border border-[#4d4d57] rounded-md bg-[#23232b]">
              <p className="text-sm text-gray-300">Current Room:</p>
              <p className="text-2xl font-bold text-[#e9a178]">{roomCode.value}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-1">
                Join Existing Room
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="roomCode"
                  value={customRoomCode.value}
                  onChange={handleRoomCodeChange}
                  placeholder="Enter 4-letter code"
                  className="bg-[#1e1e24] text-white px-3 py-2 rounded-md border border-[#3d3d47] focus:outline-none focus:ring-2 focus:ring-[#e9a178] focus:border-transparent w-full"
                  maxLength={4}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={customRoomCode.value.length !== 4 || isJoining.value}
                  className="bg-[#3d3d47] hover:bg-[#4d4d57] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="border-t border-[#3d3d47] flex-1" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="border-t border-[#3d3d47] flex-1" />
            </div>

            <button
              onClick={handleCreateNewRoom}
              disabled={isJoining.value}
              className="w-full bg-[#3d3d47] hover:bg-[#4d4d57] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create New Room
            </button>
          </div> */}

					<div className="flex flex-col justify-center items-center flex-1">
						<h2 className="text-xl font-bold text-[#e9a178] mb-6">
							Ready to Begin?
						</h2>
						<p className="text-gray-300 text-center mb-8">
							Once connected, click the button below to start the quiz!
						</p>
						<button
							onClick={handleStartQuiz}
							disabled={connectionStatus.value !== "connected"}
							className="w-full max-w-md bg-[#e9a178] hover:bg-[#d8906c] text-[#1e1e24] font-bold px-4 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-lg"
						>
							{connectionStatus.value === "connected"
								? "Start Quiz"
								: "Connecting..."}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
