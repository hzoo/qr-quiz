import { useEffect, useState } from "react";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { quizState, answerQuestion, restartQuiz, generateQuestions } from "@/store/quiz";
import { QRCodeOption } from "./QRCodeOption";
import { BarcodeScanner } from "./BarcodeScanner";
import { QRCode } from "./QRCode";

// Special command QR codes
const QR_COMMANDS = {
  RESET: "cmd:reset",
  SHOW_ANSWERS: "cmd:answers",
  HIDE_ANSWERS: "cmd:hide_answers"
};

export function Quiz() {
  // Required for signals to work in React
  useSignals();
  
  // Local state for showing answers in results screen
  const [showingAnswers, setShowingAnswers] = useState(false);
  
  // Track user answers for review
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // Load questions on first render
  useEffect(() => {
    // Generate new questions in the background
    // We already have default questions, so this just refreshes them
    generateQuestions();
  }, []);
  
  // Extract values from quiz state
  const { 
    questions, 
    currentQuestionIndex, 
    score, 
    showResult, 
    lastAnswer, 
    isCorrect,
    isLoading,
    error
  } = quizState.value;
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Handle barcode scan
  const handleScan = (value: string) => {
    // Handle special command QR codes
    if (value === QR_COMMANDS.RESET) {
      restartQuiz();
      setUserAnswers({});
      return;
    }
    
    if (value === QR_COMMANDS.SHOW_ANSWERS) {
      setShowingAnswers(true);
      return;
    }
    
    if (value === QR_COMMANDS.HIDE_ANSWERS) {
      setShowingAnswers(false);
      return;
    }
    
    // If we're showing the results, special QR codes were handled above
    // Any other QR code will restart the quiz
    if (showResult) {
      restartQuiz();
      setUserAnswers({});
      return;
    }
    
    // Otherwise, answer the current question and track the answer
    answerQuestion(value);
    
    // Record the user's answer for this question
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };
  
  // Use effect to refocus scanner when questions change
  useSignalEffect(() => {
    // Just watching currentQuestionIndex changes
    const questionIndex = quizState.value.currentQuestionIndex;
    
    // Refocus the scanner input when question changes
    const inputElement = document.querySelector('input[aria-label="Barcode Scanner Input"]') as HTMLInputElement;
    if (inputElement) {
      setTimeout(() => {
        inputElement.focus();
      }, 100);
    }
  });

  // Reset showing answers state when quiz restarts
  useEffect(() => {
    if (!showResult) {
      setShowingAnswers(false);
    }
  }, [showResult]);

  // Error notification
  const errorNotification = error ? (
    <div className="mb-6 bg-[#3a2f2d] border border-[#d9a295] rounded-lg p-4 flex items-start justify-between fade-in">
      <div>
        <p className="font-semibold text-[#d9a295]">Error refreshing questions</p>
        <p className="text-sm text-[#e0c3bc] mt-1">{error}</p>
      </div>
      <button 
        onClick={() => generateQuestions()} 
        className="px-3 py-1 bg-[#d9a295] text-[#2b2b33] text-sm rounded-lg hover:bg-[#e0c3bc] transition-colors flex-shrink-0 ml-4"
      >
        Try Again
      </button>
    </div>
  ) : null;
  
  // Show the results screen if the quiz is complete
  if (showResult) {
    return (
      <div className="max-w-4xl mx-auto p-6 fade-in" onClick={(e) => e.stopPropagation()}>
        <BarcodeScanner onScan={handleScan} />
        
        <div className="text-center cozy-card p-6 rounded-xl paper-texture">
          <h2 className="text-2xl font-bold mb-2 text-[#d8b4a0]">Quiz Complete!</h2>
          <p className="text-lg mb-6 text-[#ebebf0]">
            Your score: <span className="font-bold text-[#86b3d1]">{score}</span> out of {questions.length}
          </p>
          
          {/* QR Code Control Row */}
          <div className="flex justify-center gap-8 mb-6">
            {/* Reset Quiz QR Code */}
            <div className="text-center">
              <button 
                onClick={() => handleScan(QR_COMMANDS.RESET)}
                className="bg-[#3b3b45] p-3 rounded-md shadow-md overflow-hidden scanning hover:bg-[#45454f] transition-colors"
              >
                <QRCode 
                  value={QR_COMMANDS.RESET} 
                  size={150} 
                />
              </button>
              <p className="text-xs mt-2 text-[#c5c5d1]">Restart Quiz</p>
            </div>
            
            {/* Show/Hide Answers QR Code */}
            <div className="text-center">
              <button 
                onClick={() => handleScan(showingAnswers ? QR_COMMANDS.HIDE_ANSWERS : QR_COMMANDS.SHOW_ANSWERS)}
                className="bg-[#3b3b45] p-3 rounded-md shadow-md overflow-hidden scanning hover:bg-[#45454f] transition-colors"
              >
                <QRCode 
                  value={showingAnswers ? QR_COMMANDS.HIDE_ANSWERS : QR_COMMANDS.SHOW_ANSWERS} 
                  size={150} 
                />
              </button>
              <p className="text-xs mt-2 text-[#c5c5d1]">
                {showingAnswers ? 'Hide Answers' : 'Show Answers'}
              </p>
            </div>
          </div>
          
          {/* Answer Review Section - only shown when toggled on */}
          {showingAnswers && (
            <div className="mb-4 max-h-[400px] overflow-y-auto border border-[#494952] rounded-lg p-3 bg-[#333339]">
              <h3 className="text-sm font-semibold text-[#86b3d1] mb-2 text-center">Answer Review</h3>
              
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const correctOption = question.options.find(opt => opt.isCorrect);
                  const userAnswerId = userAnswers[question.id];
                  const userOption = userAnswerId 
                    ? question.options.find(opt => opt.id === userAnswerId) 
                    : null;
                  const isCorrect = userOption?.isCorrect || false;
                  
                  return (
                    <div key={question.id} className="p-2 bg-[#3b3b45] rounded-lg text-left">
                      <p className="text-xs font-medium text-[#c5c5d1] mb-1">
                        {index + 1}. {question.text}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <span className="inline-block w-4 h-4 bg-[#313b34] rounded-full flex items-center justify-center mr-1">
                            <span className="text-[0.6rem] text-[#a3c9a8]">✓</span>
                          </span>
                          <span className="text-[#a3c9a8]">{correctOption?.text}</span>
                        </div>
                        
                        {userOption && (
                          <div className="flex items-center">
                            <span className={`text-xs ${isCorrect ? 'text-[#a3c9a8]' : 'text-[#d9a295]'}`}>
                              You: {userOption.text}
                            </span>
                            <span className="ml-1">
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <p className="text-sm text-[#a0a0af] mt-3">
            Scan any QR code to restart the quiz
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 fade-in" onClick={(e) => e.stopPropagation()}>
      <BarcodeScanner onScan={handleScan} />
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#86b3d1]">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-base text-[#c5c5d1]">
              Score: <span className="font-semibold text-[#d8b4a0]">{score}</span>
            </div>
            <button
              onClick={() => !isLoading && generateQuestions()}
              className="ml-4 px-3 py-1 text-sm bg-[#86b3d1] text-[#2b2b33] rounded-lg hover:bg-[#9ec8e3] transition-colors flex items-center font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-[#2b2b33] border-t-transparent rounded-full mr-2" />
                  Loading...
                </>
              ) : 'New Questions'}
            </button>
          </div>
        </div>
        
        {errorNotification}
        
        <div className={`text-lg mb-8 p-5 rounded-lg relative cozy-card ${
          currentQuestion.isDemo 
            ? 'demo-question bg-[#3a3541] border-[#d8b4a0]' 
            : 'bg-[#3b3b45] border-[#86b3d1]/20'
        }`}>
          <div className="relative z-10">
            {currentQuestion.text}
          </div>
        </div>
        
        {isCorrect !== null && (
          <div className={`mb-6 p-4 rounded-lg fade-in ${
            isCorrect 
              ? 'bg-[#313b34] border border-[#a3c9a8]' 
              : 'bg-[#3a2f2d] border border-[#d9a295]'
          }`}>
            <p className="text-base">
              {isCorrect 
                ? '✓ Correct! Moving to next question...' 
                : '✗ Incorrect! Moving to next question...'}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentQuestion.options.map((option) => (
            <QRCodeOption
              key={option.id}
              option={option}
              onScan={handleScan}
              isSelected={lastAnswer === option.id}
              isCorrect={lastAnswer === option.id ? isCorrect : null}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-[#333339] rounded-lg text-center border border-[#e9a178]/30 shadow-sm">
        <p className="text-[#e9a178] font-medium">
          Scan a code or tap an option to answer
        </p>
      </div>
    </div>
  );
} 