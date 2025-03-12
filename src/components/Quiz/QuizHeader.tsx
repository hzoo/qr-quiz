import { QRCode } from "@/components/QRCode";
import { BarcodeStripes } from "@/components/BarcodeStripes";
import { scannerEnabled, hideQrCodes, helpModalOpen, QR_COMMANDS, scannerReady } from "@/store/uiSignals";
import { connectionStatus } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";
import { quizState } from "@/store/quiz";

type QuizHeaderProps = {
  title: string;
};

export function QuizHeader({
  title
}: QuizHeaderProps) {
  useSignals();
  
  // Get data from quizState
  const { questions, currentQuestionIndex, userAnswers } = quizState.value;
  
  // Calculate correct answers count
  const correctAnswersCount = Object.entries(userAnswers).filter(([questionId]) => {
    const question = questions.find(q => q.id === questionId);
    const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
    return userOption?.isCorrect;
  }).length;
  
  // Connection status colors
  const statusColors = {
    disconnected: 'bg-red-500',
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500'
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
      {/* Main header with game info */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side - Game title and progress */}
        <div className="flex items-center gap-3">
          {/* Game title with barcode visual */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[#e9a178]">{title}</h1>
            <div className="h-6 mx-2">
              <BarcodeStripes />
            </div>
          </div>
          
          {/* Question progress with game-like styling */}
          <div className="inline-flex rounded-full px-4 py-1 bg-[#23232b] border border-[#3d3d47] shadow-inner">
            <div className="flex items-center gap-1">
              <span className="text-xs uppercase tracking-wider opacity-80">Question</span>
              <div className="flex items-center">
                <span className="text-xl font-bold text-[#e9a178]">{currentQuestionIndex + 1}</span>
                <span className="mx-1 text-gray-400">/</span>
                <span className="text-xl font-bold">{questions.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Score and scanner status */}
        <div className="flex items-center gap-4">
          {/* Score display */}
          <div className="inline-flex rounded-full px-4 py-1 bg-[#23232b] border border-[#3d3d47] shadow-inner">
            <div className="flex items-center gap-1">
              <span className="text-xs uppercase tracking-wider opacity-80">Score</span>
              <span className="text-xl font-bold text-[#e9a178]">{correctAnswersCount}</span>
            </div>
          </div>
          
          {/* Scanner status indicator with toggle */}
          <div className="flex items-center">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${scannerEnabled.value ? 'bg-[#23232b] border-green-500/50' : 'bg-[#23232b] border-red-500/50'}`}>
              <div className={`w-2 h-2 rounded-full ${scannerEnabled.value ? (scannerReady.value ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'}`} />
              <span className="text-xs font-medium">
                {scannerEnabled.value ? (scannerReady.value ? 'Scanner Ready' : 'Click for Scanner') : 'Scanner Off'}
              </span>
              <button 
                onClick={toggleScanner}
                className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center ${scannerEnabled.value ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                title={scannerEnabled.value ? "Disable Scanner" : "Enable Scanner"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d={scannerEnabled.value 
                    ? "M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" 
                    : "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom controls bar - more compact and optimized for projection */}
      <div className="px-4 py-1 flex items-center justify-between bg-[#23232b]">
        {/* Left side - Help QR code */}
        <div className="flex items-center gap-3">
          {/* Help QR code - more compact */}
          <div className="group relative" onClick={openHelpModal}>
            <div className="bg-white p-1 rounded-md flex items-center cursor-pointer hover:bg-gray-100 transition-colors">
              <QRCode 
                value={QR_COMMANDS.INSTRUCTIONS}
                size={32}
                className="w-8 h-8"
              />
              <span className="ml-1 text-[#1e1e24] text-xs font-medium px-1">HELP</span>
            </div>
            <div className="absolute left-0 top-full mt-1 text-xs bg-[#2b2b33] px-2 py-1 rounded-md border border-[#3d3d47] whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Scan or click for help
            </div>
          </div>
          
          {/* Connection status indicator */}
          <div className="flex items-center gap-1 text-xs">
            <div className={`w-2 h-2 rounded-full ${statusColors[connectionStatus.value]}`} />
            <span className="opacity-80">{connectionStatus.value}</span>
          </div>
        </div>
        
        {/* Right-side controls */}
        <div className="flex items-center gap-3">
          {/* Hide QR Code Toggle */}
          <button 
            onClick={toggleQrCodes}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${hideQrCodes.value ? 'bg-purple-700/70 hover:bg-purple-700/90' : 'bg-[#3d3d47] hover:bg-[#4d4d57]'}`}
            title={hideQrCodes.value ? "Show QR Codes" : "Hide QR Codes"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">{hideQrCodes.value ? "Show QR" : "Hide QR"}</span>
          </button>
          
          {/* Phone scanner QR code - more compact */}
          <div className="group relative" onClick={() => window.open("https://barcode-fun-party.hzoo.partykit.dev/qr.html", "_blank")}>
            <div className="flex items-center p-1 bg-white rounded-md hover:bg-gray-100 transition-colors border border-[#d8b4a0] cursor-pointer">
              <QRCode 
                value="https://barcode-fun-party.hzoo.partykit.dev/qr.html" 
                size={32}
                className="w-8 h-8"
              />
              <span className="text-[10px] leading-tight text-[#1e1e24] font-bold px-1">
                PHONE<br/>SCANNER
              </span>
            </div>
            <div className="absolute right-0 top-full mt-1 p-1 bg-[#2b2b33] rounded-md border border-[#3d3d47] shadow-lg text-xs whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Scan or click to open QR scanner on phone
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 