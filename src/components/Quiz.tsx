import { useEffect } from "react";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { quizState, answerQuestion, restartQuiz, generateQuestions } from "@/store/quiz";
import { QRCodeOption } from "./QRCodeOption";
import { BarcodeScanner } from "./BarcodeScanner";
import { QRCode } from "./QRCode";

export function Quiz() {
  // Required for signals to work in React
  useSignals();
  
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
    // If we're showing the results, restart on any scan
    if (showResult) {
      restartQuiz();
      return;
    }
    
    // Otherwise, answer the current question
    answerQuestion(value);
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
        
        <div className="text-center cozy-card p-8 rounded-xl paper-texture">
          <h2 className="text-3xl font-bold mb-4 text-[#d8b4a0]">Quiz Complete!</h2>
          <p className="text-xl mb-6 text-[#ebebf0]">
            Your score: <span className="font-bold text-[#86b3d1]">{score}</span> out of {questions.length}
          </p>
          
          <div className="mt-8 p-6 bg-[#333339] rounded-lg flex flex-col items-center border border-[#d8b4a0] shadow-md">
            <p className="text-lg mb-4 text-[#ebebf0]">Scan this code to restart</p>
            
            <div className="bg-[#3b3b45] p-4 rounded-lg shadow-md">
              <QRCode value="reset-quiz" size={160} label="Reset Quiz" />
            </div>
            
            <p className="text-sm mt-4 text-[#a0a0af]">
              (Any QR code will restart the quiz)
            </p>
          </div>
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