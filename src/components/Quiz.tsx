import { useEffect, useState } from "react";
import { useSignalEffect, useSignals, useSignal } from "@preact/signals-react/runtime";
import { quizState, answerQuestion, restartQuiz, generateQuestions, nextQuestionsQueue, initQuiz } from "@/store/quiz";
import { QRCodeOption } from "./QRCodeOption";
import { BarcodeScanner } from "./BarcodeScanner";
import { QRCode } from "./QRCode";

// Special command QR codes
const QR_COMMANDS = {
  PREFIX: "cmd:",
  RESET: "cmd:reset",
  SHOW_ANSWERS: "cmd:show_answers",
  HIDE_ANSWERS: "cmd:hide_answers",
  ANSWERS: "cmd:answers"
};

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
    console.log("Scan value:", value);
    
    // Handle special commands with prefix "cmd:"
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
      
      // Handle the "cmd:answers" command to show results
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
      // Find if this matches any of the current question's option IDs
      const option = currentQuestion.options.find((o) => o.id === value);
      if (option) {
        answerQuestion(option.id);
      } else {
        console.log("Scanned value doesn't match any option for the current question");
      }
    }
  };
  
  // When there's an error loading questions
  if (error) {
    return (
      <div className="flex flex-col">
        <BarcodeScanner onScan={handleScan} />
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl w-full bg-[#2b2b33] p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error Loading Quiz</h1>
            <p className="text-center mb-6">{error}</p>
            <button 
              onClick={() => restartQuiz()}
              className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // When there are no questions (should rarely happen)
  if (!currentQuestion) {
    return (
      <div className="flex flex-col">
        <BarcodeScanner onScan={handleScan} />
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
      <div className="flex flex-col">
        <BarcodeScanner onScan={handleScan} />
        <div className="flex flex-col items-center p-2">
          <div className="max-w-4xl w-full lg:max-w-6xl bg-[#2b2b33] p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Quiz Results</h1>
            <p className="text-center text-xl mb-6">
              <span className="text-2xl sm:text-3xl font-bold">
                {Object.entries(userAnswers).filter(([questionId]) => {
                  const question = questions.find(q => q.id === questionId);
                  const userOption = question?.options.find(o => o.id === userAnswers[questionId]);
                  return userOption?.isCorrect;
                }).length}
              </span>
              <span className="text-gray-400"> / </span>
              <span className="text-2xl sm:text-3xl font-bold">{questions.length}</span>
            </p>
            
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Restart Quiz QR Code */}
                <div className="flex flex-col items-center">
                  <span className="mb-2 text-sm font-medium">Restart Quiz</span>
                  <div 
                    className="w-full max-w-[180px] sm:max-w-[200px] lg:max-w-[240px] cursor-pointer bg-white p-2 rounded-lg" 
                    onClick={() => handleScan(QR_COMMANDS.RESET)}
                  >
                    <QRCode 
                      value={QR_COMMANDS.RESET} 
                      className="w-full aspect-square"
                    />
                  </div>
                </div>
                
                {/* Toggle Answers QR Code */}
                <div className="flex flex-col items-center">
                  <span className="mb-2 text-sm font-medium">
                    {showingAnswers ? "Hide Answers" : "Show Answers"}
                  </span>
                  <div 
                    className="w-full max-w-[180px] sm:max-w-[200px] lg:max-w-[240px] cursor-pointer bg-white p-2 rounded-lg" 
                    onClick={() => setShowingAnswers(prev => !prev)}
                  >
                    <QRCode 
                      value={showingAnswers ? QR_COMMANDS.HIDE_ANSWERS : QR_COMMANDS.SHOW_ANSWERS} 
                      className="w-full aspect-square"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {showingAnswers && (
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questions.map((q, idx) => {
                    const userAnswerId = userAnswers[q.id];
                    const userOption = q.options.find(o => o.id === userAnswerId);
                    const correctOption = q.options.find(o => o.isCorrect);
                    
                    return (
                      <div key={q.id} className="p-3 rounded-lg bg-[#33333b] flex flex-col">
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
            )}
            
            <div className="mt-8 text-center">
              <div className="mb-2 text-sm text-gray-400">
                {nextQuestionsQueue.value.length > 0 
                  ? "New questions are ready!" 
                  : isGeneratingNewQuestions.value 
                    ? "Preparing next set of questions..."
                    : "Will generate new questions when you restart"}
              </div>
              <button
                onClick={() => restartQuiz()}
                className="px-6 py-3 bg-[#e9a178] text-[#1e1e24] font-medium rounded-lg shadow hover:bg-[#d8926a] transition-colors"
              >
                Start New Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal quiz view with question and options
  return (
    <div className="flex flex-col">
      <BarcodeScanner onScan={handleScan} />
      
      {/* Quiz header */}
      <header className="p-4 sm:p-6 bg-[#2b2b33] shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-6">
          <div className="text-sm sm:text-base">
            Question <span className="font-bold">{currentQuestionIndex + 1}</span> of <span className="font-bold">{questions.length}</span>
          </div>
          <div className="text-sm sm:text-base">
            Score: <span className="font-bold">{score}</span>
          </div>
          {isGeneratingNewQuestions.value && (
            <div className="flex items-center text-sm text-yellow-400">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse mr-1" />
              Loading new questions...
            </div>
          )}
        </div>
      </header>
      
      {/* Main quiz content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col">
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
          {/* Question with Demo badge if needed */}
          <div className="bg-[#2b2b33] p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 relative">
            {currentQuestion.isDemo && (
              <div className="absolute top-0 right-0 bg-[#e9a178] text-[#1e1e24] px-2 py-1 text-xs font-medium rounded-tr-lg rounded-bl-lg">
                DEMO
              </div>
            )}
            <h2 className="text-lg sm:text-xl md:text-2xl text-center font-medium mb-2">{currentQuestion.text}</h2>
            <p className="text-center text-sm text-gray-400">Scan a barcode or tap an option to answer</p>
          </div>
          
          {/* Options grid - responsive based on screen size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        </div>
      </main>
    </div>
  );
}
