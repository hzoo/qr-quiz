import { useEffect, useState } from "react";
import { useSignalEffect, useSignals, useSignal } from "@preact/signals-react/runtime";
import { quizState, answerQuestion, restartQuiz, generateQuestions, nextQuestionsQueue, initQuiz } from "@/store/quiz";
import { QRCodeOption } from "./QRCodeOption";
import { BarcodeScanner } from "./BarcodeScanner";
import { QRCode } from "./QRCode";
import { signal, useComputed } from "@preact/signals-react";

// Special command QR codes - using minimal characters for easier scanning
const QR_COMMANDS = {
  PREFIX: "c:",
  RESET: "c:r",
  SHOW_ANSWERS: "c:s",
  HIDE_ANSWERS: "c:h",
  ANSWERS: "c:a",
  CLOSE_HELP: "c:c"
};

// Add instruction QR code command - shortened
const QR_INSTRUCTIONS = "c:i";

// Global scanner enabled state using a signal
const scannerEnabled = signal(true);

export function Quiz() {
  // Required for signals to work in React
  useSignals();
  
  const [showingAnswers, setShowingAnswers] = useState(false);
  const shouldQueueNewQuestions = useSignal(false);
  const isGeneratingNewQuestions = useSignal(false);
  
  // Extract values from quiz state
  const { 
    questions, 
    currentQuestionIndex, 
    score, 
    showResult, 
    lastAnswer, 
    isCorrect,
    isLoading,
    error,
    userAnswers
  } = quizState.value;
  
  // Add help modal state
  const helpModalOpen = useSignal(false);
  
  // Initial question load if needed
  useEffect(() => {
    // Only initialize on first load if we need to
    if (questions.length === 0 && !isGeneratingNewQuestions.value) {
      console.log('Initializing quiz with questions');
      isGeneratingNewQuestions.value = true;
      initQuiz().finally(() => {
        isGeneratingNewQuestions.value = false;
      });
    }
  }, [questions.length, isGeneratingNewQuestions]);
  
  // Handle queuing of new questions when at results screen
  useEffect(() => {
    if (showResult && nextQuestionsQueue.value.length === 0 && !isLoading && !isGeneratingNewQuestions.value && shouldQueueNewQuestions.value) {
      console.log('Queuing next questions in background');
      isGeneratingNewQuestions.value = true;
      generateQuestions().finally(() => {
        isGeneratingNewQuestions.value = false;
      });
      shouldQueueNewQuestions.value = false;
    }
  }, [showResult, isLoading, shouldQueueNewQuestions, isGeneratingNewQuestions]); 
  
  // Set flag to queue new questions when showing results
  useEffect(() => {
    if (showResult && nextQuestionsQueue.value.length === 0 && !isLoading && !isGeneratingNewQuestions.value && !shouldQueueNewQuestions.value) {
      console.log('Setting flag to queue new questions');
      shouldQueueNewQuestions.value = true;
    }
  }, [showResult, isLoading, shouldQueueNewQuestions, isGeneratingNewQuestions]);
  
  // Current question or undefined if we're out of questions
  const currentQuestion = questions[currentQuestionIndex];
  
  // Monitor quiz state changes - store answers by question ID
  useSignalEffect(() => {
    if (lastAnswer && currentQuestion) {
      console.log('Storing answer:', {
        questionId: currentQuestion.id,
        answerId: lastAnswer,
        currentAnswers: userAnswers
      });
      
      // Update the quiz state with the new answer
      quizState.value = {
        ...quizState.value,
        userAnswers: {
          ...quizState.value.userAnswers,
          [currentQuestion.id]: lastAnswer
        }
      };
    }
  });
  
  const handleScan = (value: string) => {
    // Handle instruction QR code
    if (value === QR_INSTRUCTIONS) {
      setHelpModalOpen(true);
      return;
    }
    
    // Handle close help QR code
    if (value === QR_COMMANDS.CLOSE_HELP) {
      setHelpModalOpen(false);
      return;
    }
    
    console.log("Scan value:", value);
    
    // Handle special commands with prefix "c:"
    if (value.startsWith(QR_COMMANDS.PREFIX)) {
      // Handle specific commands
      if (value === QR_COMMANDS.SHOW_ANSWERS) {
        setShowingAnswers(true);
        return;
      }
      
      if (value === QR_COMMANDS.HIDE_ANSWERS) {
        setShowingAnswers(false);
        return;
      }
      
      if (value === QR_COMMANDS.RESET) {
        // Reset the quiz without triggering generation
        restartQuiz();
        setShowingAnswers(false);
        
        // Check if we need to schedule generation
        if (nextQuestionsQueue.value.length === 0 && !quizState.value.isLoading) {
          shouldQueueNewQuestions.value = true;
        }
        return;
      }
      
      // Handle the "c:a" command to show results
      if (value === QR_COMMANDS.ANSWERS) {
        quizState.value = {
          ...quizState.value,
          showResult: true,
        };
        return;
      }
    }

    // Skip if currently showing feedback for an answer
    if (lastAnswer) return;
    
    // For answer scans, skip if already showing results
    if (showResult) return;
    
    // Answer the current question
    if (currentQuestion) {
      // First try to find by exact ID match
      let matchedOption = currentQuestion.options.find(o => o.id === value);
      
      // If no match found, try to match by the simple code (just the option letter)
      if (!matchedOption) {
        const simpleCode = value.trim().toUpperCase();
        matchedOption = currentQuestion.options.find(o => {
          // Extract letter part from ID (e.g., "A" from "q0_A")
          const optionLetter = o.id.split('_').pop()?.toUpperCase() || '';
          return optionLetter === simpleCode;
        });
      }
      
      if (matchedOption) {
        answerQuestion(matchedOption.id);
      } else {
        console.log("Scanned value doesn't match any option for the current question");
      }
    }
  };
  
  // Handle toggling help modal
  const setHelpModalOpen = (isOpen: boolean) => {
    helpModalOpen.value = isOpen;
  };
  
  // Add access to the barcode scanner state
  const [scannerReady, setScannerReady] = useState(true);
  
  // Function to update scanner status
  const updateScannerStatus = (isReady: boolean) => {
    setScannerReady(isReady);
  };
  
  // Function to toggle scanner enabled/disabled
  const toggleScanner = () => {
    scannerEnabled.value = !scannerEnabled.value;
  };
  
  // Update BarcodeScanner component to be conditionally rendered based on scannerEnabled
  const renderBarcodeScanner = () => {
    if (!scannerEnabled.value) return null;
    
    return (
      <div className="sr-only">
        <BarcodeScanner 
          onScan={handleScan} 
          onStatusChange={updateScannerStatus}
        />
      </div>
    );
  };
  
  // When there's an error loading questions
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[#1e1e24] text-[#ebebf0] overflow-hidden">
        {renderBarcodeScanner()}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl w-full bg-[#2b2b33] p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error Loading Quiz</h1>
            <p className="text-center mb-6">{error}</p>
            <button 
              onClick={() => restartQuiz()}
              className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // When there are no questions available
  if (!currentQuestion) {
    return (
      <div className="flex flex-col h-screen bg-[#1e1e24] text-[#ebebf0] overflow-hidden">
        {renderBarcodeScanner()}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl w-full bg-[#2b2b33] p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-center mb-6">No Questions Available</h1>
            <button 
              onClick={() => restartQuiz()}
              className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
            >
              Reload Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // When showing results
  if (showResult) {
    console.log('Results screen - answers:', userAnswers);
    console.log('Questions:', questions.map(q => ({ id: q.id, text: q.text })));

    return (
      <div className="flex flex-col h-screen bg-[#1e1e24] text-[#ebebf0] overflow-hidden">
        {renderBarcodeScanner()}
        
        {/* Help modal */}
        {helpModalOpen.value && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setHelpModalOpen(false)}>
            <div className="bg-[#2b2b33] p-5 rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-3">Barcode Quiz Help</h2>
              <p className="mb-3">Scan the QR codes with your barcode scanner to navigate the quiz:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Each QR code represents an answer option</li>
                <li>The corner position of each QR code matches its option letter</li>
                <li>Scan the "Restart Quiz" QR code to start over</li>
                <li>Scan the "Show/Hide Answers" QR code to toggle answer visibility</li>
              </ul>
              
              {/* Close QR code */}
              <div className="flex flex-col items-center mb-4">
                <span className="text-sm mb-2">Scan to close help</span>
                <div className="bg-white p-2 rounded-lg max-w-[120px]">
                  <QRCode 
                    value={QR_COMMANDS.CLOSE_HELP}
                    className="w-full aspect-square"
                  />
                </div>
              </div>
              
              <button 
                className="w-full py-2 bg-[#e9a178] text-[#1e1e24] rounded-lg font-medium"
                onClick={() => setHelpModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Compact header */}
        <header className="bg-[#2b2b33] py-2 border-b border-[#3d3d47] relative z-10">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            {/* Instructions QR code in top left - now clickable */}
            <div className="flex items-center">
              <div className="relative group cursor-pointer" onClick={() => setHelpModalOpen(true)}>
                <div className="bg-white p-1 rounded-md w-10 h-10 hover:scale-105 transition-transform">
                  <QRCode 
                    value={QR_INSTRUCTIONS}
                    className="w-full h-full"
                  />
                </div>
                <span className="absolute left-0 top-full mt-1 text-xs bg-[#2b2b33] px-1 py-0.5 rounded whitespace-nowrap">
                  Scan or click for help
                </span>
              </div>
            </div>
            
            <h1 className="text-xl font-bold">Quiz Results</h1>
            
            {/* Right-side status only */}
            <div className="flex items-center gap-2">
              {/* Scanner status indicator with toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#3d3d47] px-2 py-1 rounded-md">
                  <div className={`w-2 h-2 rounded-full ${scannerEnabled.value ? (scannerReady ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-500'}`} />
                  <span className="text-xs">
                    {scannerEnabled.value ? (scannerReady ? 'Scanner Ready' : 'Click for Scanner') : 'Scanner Off'}
                  </span>
                </div>
                <button 
                  onClick={toggleScanner}
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${scannerEnabled.value ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                  title={scannerEnabled.value ? "Disable Scanner" : "Enable Scanner"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d={scannerEnabled.value 
                      ? "M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.25 5.507v11.561L5.853 2.671c.15-.043.306-.075.467-.094a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93zM3.75 21V6.932l14.063 14.063L12 18.088l-7.165 3.583A.75.75 0 013.75 21z" 
                      : "M21.75 17.25v-1.5a.75.75 0 00-.75-.75h-3v-3a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v3h-3a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h3v3c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-3h3a.75.75 0 00.75-.75zM8.25 2.104a.75.75 0 00-.375.656V9.75a.75.75 0 00.75.75h6.375a.75.75 0 01.583 1.223L8.75 19.067a.75.75 0 01-1.251-.337v-6.98a.75.75 0 00-.75-.75H1.057a.75.75 0 01-.656-1.125L7.51 2.104a.75.75 0 01.74 0z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-4 flex flex-col max-h-[calc(100vh-64px)] overflow-hidden">
          <div className="w-full mx-auto flex-1 flex flex-col max-w-5xl 2xl:max-w-[90%] h-full">
            {/* Score display */}
            <div className="bg-[#2b2b33] p-3 rounded-lg shadow-md mb-3 text-center">
              <p className="text-xl">
                <span className="text-2xl font-bold text-[#e9a178]">
                  {Object.entries(userAnswers).filter(([questionId]) => {
                    const question = questions.find(q => q.id === questionId);
                    const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
                    return userOption?.isCorrect;
                  }).length}
                </span>
                <span className="text-gray-400"> / </span>
                <span className="text-2xl font-bold">{questions.length}</span>
              </p>
            </div>
            
            {/* Reorganized layout - grid with answers visible by default */}
            <div className="grid grid-rows-[auto_1fr] h-[calc(100%-60px)] gap-3">
              {/* Top row with QR code */}
              <div className="mx-auto w-full max-w-md flex items-center justify-center">
                {/* Restart Quiz QR Code - bigger size */}
                <div className="p-4 bg-[#23232b] rounded-xl shadow-md flex flex-col items-center w-full">
                  <span className="block text-xl font-medium mb-3 text-center">Restart Quiz</span>
                  <div 
                    className="cursor-pointer bg-white p-4 rounded-lg w-full max-w-[280px] mx-auto" 
                    onClick={() => handleScan(QR_COMMANDS.RESET)}
                  >
                    <QRCode 
                      size={280}
                      value={QR_COMMANDS.RESET} 
                      className="w-full aspect-square"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bottom row with answers - always visible in a scrollable container */}
              <div className="mt-2 bg-[#2b2b33] p-4 rounded-lg shadow-md overflow-y-auto">
                <h2 className="text-lg font-medium mb-3">Question Answers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questions.map((q, idx) => {
                    const userOption = q.options.find(o => o.id === userAnswers[q.id]);
                    const correctOption = q.options.find(o => o.isCorrect);
                    
                    return (
                      <div key={q.id} className="p-3 bg-[#23232b] rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-base">
                            Q{idx + 1}: {q.text}
                          </p>
                          {userOption ? 
                            (userOption.isCorrect ? 
                              <span className="text-emerald-400 shrink-0">✓</span> : 
                              <span className="text-red-400 shrink-0">✗</span>)
                            : <span className="text-red-400 shrink-0">–</span>
                          }
                        </div>
                        <div className="mt-1 text-sm text-gray-300">
                          {userOption ? (
                            <>
                              <span className="opacity-75">Your answer:</span>{" "}
                              <span className={userOption.isCorrect ? "text-emerald-400" : "text-red-400"}>
                                {userOption.text}
                              </span>
                            </>
                          ) : (
                            <span className="text-red-400">Not answered</span>
                          )}
                          {(!userOption || !userOption.isCorrect) && (
                            <>
                              <br />
                              <span className="opacity-75">Correct:</span>{" "}
                              <span className="text-emerald-400">{correctOption?.text}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal quiz view with question and options
  return (
    <div className="flex flex-col h-screen bg-[#1e1e24] text-[#ebebf0] relative overflow-hidden">
      {renderBarcodeScanner()}
      
      {/* Help modal */}
      {helpModalOpen.value && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setHelpModalOpen(false)}>
          <div className="bg-[#2b2b33] p-5 rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-3">Barcode Quiz Help</h2>
            <p className="mb-3">Scan the QR codes with your barcode scanner to navigate the quiz:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Each QR code represents an answer option</li>
              <li>The corner position of each QR code matches its option letter</li>
              <li>Top-left (A), Top-right (B), Bottom-left (C), Bottom-right (D)</li>
              <li>Correct answers turn green, incorrect turn red</li>
            </ul>
            
            {/* Close QR code */}
            <div className="flex flex-col items-center mb-4">
              <span className="text-sm mb-2">Scan to close help</span>
              <div className="bg-white p-2 rounded-lg max-w-[120px]">
                <QRCode 
                  value={QR_COMMANDS.CLOSE_HELP}
                  className="w-full aspect-square"
                />
              </div>
            </div>
            
            <button 
              className="w-full py-2 bg-[#e9a178] text-[#1e1e24] rounded-lg font-medium"
              onClick={() => setHelpModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Compact header with improved progress indicator */}
      <header className="bg-[#2b2b33] py-2 border-b border-[#3d3d47] relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Instructions QR code in top left - now clickable */}
          <div className="flex items-center">
            <div className="relative group cursor-pointer" onClick={() => setHelpModalOpen(true)}>
              <div className="bg-white p-1 rounded-md w-10 h-10 hover:scale-105 transition-transform">
                <QRCode 
                  value={QR_INSTRUCTIONS}
                  className="w-full h-full"
                />
              </div>
              <span className="absolute left-0 top-full mt-1 text-xs bg-[#2b2b33] px-1 py-0.5 rounded whitespace-nowrap">
                Scan or click for help
              </span>
            </div>
          </div>
          
          {/* Center progress indicator as badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-3">
            <div className="bg-[#3d3d47] rounded-full px-3 py-1 flex items-center shadow-md">
              <span className="text-sm font-medium">Question</span>
              <span className="ml-1 text-base font-bold text-[#e9a178]">{currentQuestionIndex + 1}</span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-base font-bold">{questions.length}</span>
            </div>
            
            <div className="bg-[#3d3d47] rounded-full px-3 py-1 flex items-center shadow-md">
              <span className="text-sm font-medium">Score</span>
              <span className="ml-1 text-base font-bold text-[#e9a178]">{
                Object.entries(userAnswers).filter(([questionId]) => {
                  const question = questions.find(q => q.id === questionId);
                  const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
                  return userOption?.isCorrect;
                }).length
              }</span>
            </div>
          </div>
          
          {/* Right-side with scanner status only */}
          <div className="flex items-center gap-2">
            {/* Scanner status indicator with toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#3d3d47] px-2 py-1 rounded-md">
                <div className={`w-2 h-2 rounded-full ${scannerEnabled.value ? (scannerReady ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-500'}`} />
                <span className="text-xs">
                  {scannerEnabled.value ? (scannerReady ? 'Scanner Ready' : 'Click for Scanner') : 'Scanner Off'}
                </span>
              </div>
              <button 
                onClick={toggleScanner}
                className={`w-7 h-7 rounded-md flex items-center justify-center ${scannerEnabled.value ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                title={scannerEnabled.value ? "Disable Scanner" : "Enable Scanner"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d={scannerEnabled.value 
                    ? "M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.25 5.507v11.561L5.853 2.671c.15-.043.306-.075.467-.094a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93zM3.75 21V6.932l14.063 14.063L12 18.088l-7.165 3.583A.75.75 0 013.75 21z" 
                    : "M21.75 17.25v-1.5a.75.75 0 00-.75-.75h-3v-3a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v3h-3a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h3v3c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-3h3a.75.75 0 00.75-.75zM8.25 2.104a.75.75 0 00-.375.656V9.75a.75.75 0 00.75.75h6.375a.75.75 0 01.583 1.223L8.75 19.067a.75.75 0 01-1.251-.337v-6.98a.75.75 0 00-.75-.75H1.057a.75.75 0 01-.656-1.125L7.51 2.104a.75.75 0 01.74 0z"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main quiz content - optimized height */}
      <main className="flex-1 p-4 flex flex-col max-h-[calc(100vh-64px)] overflow-hidden">
        <div className="w-full mx-auto flex-1 flex flex-col max-w-5xl 2xl:max-w-[90%]">
          {/* Question with Demo badge if needed - more compact */}
          <div className="bg-[#2b2b33] p-3 sm:p-4 rounded-lg shadow-md relative">
            {currentQuestion.isDemo && (
              <div className="absolute top-0 right-0 bg-[#e9a178] text-[#1e1e24] px-2 py-1 text-xs font-medium rounded-tr-lg rounded-bl-lg">
                DEMO
              </div>
            )}
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-center font-medium mb-1">{currentQuestion.text}</h2>
            <p className="text-center text-xs text-gray-400">
              Scan a barcode or tap an option to answer
            </p>
          </div>
          
          {/* Options in corner layout - optimized for widescreen */}
          <div className="relative flex-1 w-full">
            {currentQuestion.options.length <= 4 ? (
              /* Corner layout when we have 4 or fewer options */
              <div className="absolute inset-0 flex flex-wrap">
                {currentQuestion.options.map((option, index) => {
                  // Position in corners with widescreen optimization
                  const cornerPositions = [
                    "left-[5%] top-[0%]", // top-left
                    "right-[5%] top-[0%]", // top-right
                    "left-[5%] bottom-[5%]", // bottom-left
                    "right-[5%] bottom-[5%]", // bottom-right
                  ];
                  
                  // Determine corner colors for visual distinction
                  const cornerColors = [
                    "from-blue-600/20 to-blue-700/10", // top-left: blue tint
                    "from-green-600/20 to-green-700/10", // top-right: green tint
                    "from-amber-600/20 to-amber-700/10", // bottom-left: amber tint
                    "from-purple-600/20 to-purple-700/10", // bottom-right: purple tint
                  ];
                  
                  return (
                    <div 
                      key={option.id}
                      className={`absolute ${cornerPositions[index % 4]} p-3 sm:p-4 max-w-[40%] 2xl:max-w-[30%] flex flex-col items-center`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cornerColors[index % 4]} opacity-30 rounded-3xl pointer-events-none`} />
                      <QRCodeOption
                        option={option}
                        onScan={handleScan}
                        isSelected={option.id === lastAnswer}
                        isCorrect={option.id === lastAnswer ? option.isCorrect : null}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback to improved grid for more than 4 options */
              <div className="grid grid-cols-2 gap-8 md:gap-12 max-w-full mx-auto w-full">
                {currentQuestion.options.map((option) => (
                  <QRCodeOption
                    key={option.id}
                    option={option}
                    onScan={handleScan}
                    isSelected={option.id === lastAnswer}
                    isCorrect={option.id === lastAnswer ? option.isCorrect : null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
