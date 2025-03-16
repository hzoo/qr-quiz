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
import { quizStarted, questionsPerRound } from "@/store/quiz";

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
			joinRoom("");
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

	// Handle questions per round change
	const handleQuestionsChange = (value: number) => {
		questionsPerRound.value = value;
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
		joinRoom(""); // Empty string will trigger random code generation in initPartyConnection
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
		error: "bg-red-700",
	};

	return (
		<div className="flex flex-col items-center justify-center h-full p-4 max-w-6xl mx-auto gap-2">
			{/* Title with barcode styling */}
			<div className="mb-4 text-center">
				<div className="flex items-center justify-center gap-2 mb-2">
					<BarcodeStripes className="h-10 w-14" />
					<h1 className="text-7xl font-bold text-[#e9a178]">BARCODE QUIZ</h1>
					<BarcodeStripes className="h-10 w-14" />
				</div>
				<p className="text-gray-300">with henry zhu</p>
				<p className="text-xl text-gray-300 pt-4 italic">
					control everything with QR codes
				</p>
			</div>

			{/* Room information and connection status */}

			{/* {roomCode.value && (
					<div className="px-4 py-2 bg-[#2b2b33] border border-[#3d3d47] rounded-lg">
						<span className="text-sm font-semibold text-gray-300">
							ROOM CODE
						</span>
						<span className="ml-2 text-xl font-bold text-[#e9a178]">
							{roomCode.value}
						</span>
					</div>
				)} */}

			{/* Main content grid: Instructions + Room joining */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
				{/* Left side: Instructions */}
				<div className="bg-[#2b2b33] border border-[#3d3d47] rounded-lg p-6 flex flex-col">
					<h2 className="text-xl font-bold text-[#e9a178] mb-4">Either:</h2>

					{/* Help QR code */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2">
							<span className="text-[#e9a178] text-xl">📱</span>
							<p>
								Use your{" "}
								<span className="text-[#e9a178] font-semibold">
									phone's camera
								</span>{" "}
								to scan QR codes using a custom website (below)
							</p>
						</div>
						<QRCode
							value={`${window.location.origin}/qr.html${roomCode.value ? `?room=${roomCode.value}` : ""}`}
							size={230}
						/>
					</div>

					<div className="flex flex-col text-gray-300 items-center mt-3">
						<div className="flex items-center gap-2">
							<p>
								Or use a dedicated{" "}
								<span className="text-[#e9a178] font-semibold">
									barcode scanner
								</span>{" "}
								if nearby!
							</p>
							<span className="text-[#e9a178] text-xl">🔍</span>
						</div>
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
						{/* Questions per round selector */}
						<div className="w-full mb-8">
							<div className="bg-[#23232b] border border-[#3d3d47] rounded-lg p-4">
								<div className="flex justify-between items-center mb-2">
									<div className="text-sm font-medium text-gray-400">
										# of Questions
									</div>
								</div>
								<div className="mt-3 flex justify-between">
									{[4, 8, 12, 16].map((count) => (
										<button
											key={count}
											onClick={() => handleQuestionsChange(count)}
											className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
												questionsPerRound.value === count
													? "bg-[#e9a178] text-[#1e1e24]"
													: "bg-[#3d3d47] text-white hover:bg-[#4d4d57]"
											}`}
										>
											{count}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="flex flex-col items-center gap-6 w-full">
							<button
								onClick={handleStartQuiz}
								disabled={connectionStatus.value !== "connected"}
								className="w-full max-w-md bg-[#e9a178] hover:bg-[#d8906c] text-[#1e1e24] font-bold px-4 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-lg"
							>
								{connectionStatus.value === "connected"
									? "Start Quiz"
									: "Connecting..."}
							</button>

							{/* Start Quiz QR Code */}
							{connectionStatus.value === "connected" && (
								<div className="mt-1 flex flex-col items-center">
									<p className="text-gray-300 mb-3">
										or scan this QR code to start:
									</p>
									<QRCode value={QR_COMMANDS.START_QUIZ} size={150} />
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
