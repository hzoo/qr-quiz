import { useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { 
  quizState, 
  answerQuestion, 
  initQuiz,
  isGeneratingNewQuestions 
} from "@/store/quiz";
import { 
  addMessageHandler,
  removeMessageHandler,
  type MessageData
} from "@/store/partyConnection";

// Import refactored components
import { QuizHeader } from "./Quiz/QuizHeader";
import { QuizErrorView } from "./Quiz/QuizErrorView";
import { QuizLoadingView } from "./Quiz/QuizLoadingView";
import { QuizResultsView } from "./Quiz/QuizResultsView";
import { QuizQuestionView } from "./Quiz/QuizQuestionView";
import { HelpModal } from "./Quiz/HelpModal";
import { BarcodeScannerView } from "./Quiz/BarcodeScannerView";

export function Quiz() {
  // Required for signals to work in React
  useSignals();

  // Handle scan events from the barcode scanner - just handles answers, not commands
  const handleScan = useCallback((value: string) => {
    console.log("Processing scan value for quiz answer:", value);
    
    // Not a command - handle as answer
    // Save the reference to the current question's options before moving to the next
    const currentQuestion = quizState.value.questions[quizState.value.currentQuestionIndex];
    const optionIds = currentQuestion?.options.map(option => option.id) || [];
    
    // If the scan matches an option ID, answer with that ID
    if (optionIds.includes(value)) {
      answerQuestion(value);
    }
  }, []);
  
  // Initial question load if needed
  useEffect(() => {
    // Only initialize on first load if we need to
    if (quizState.value.questions.length === 0 && !isGeneratingNewQuestions.value) {
      console.log('Initializing quiz with questions');
      isGeneratingNewQuestions.value = true;
      initQuiz().finally(() => {
        isGeneratingNewQuestions.value = false;
      });
    }
  }, []);
  
  // Party kit related functionality
  // Register command handler
  useEffect(() => {
    const handlePartyMessage = (data: MessageData) => {
      console.log('Party message:', data);
      if (data.type === 'scan' && data.option) {
        handleScan(data.option);
      }
    };
    
    addMessageHandler(handlePartyMessage);
    
    return () => {
      removeMessageHandler(handlePartyMessage);
    };
  }, [handleScan]);

  // Destructure state from the quiz store for rendering conditions
  const { error, questions, currentQuestionIndex, showResult } = quizState.value;
  const currentQuestion = questions[currentQuestionIndex];

  // Base container class with console game styling
  const containerClasses = "flex flex-col h-screen bg-[#1e1e24] text-[#ebebf0] overflow-hidden";

  // Determine the content to render based on quiz state
  let content: ReactNode;
  const showHeaderAndHelp = currentQuestion && !error;

  if (error) {
    content = <QuizErrorView error={error} />;
  } else if (!currentQuestion) {
    content = <QuizLoadingView />;
  } else if (showResult) {
    content = <QuizResultsView />;
  } else {
    content = <QuizQuestionView handleScan={handleScan} />;
  }

  // Return a single layout with conditional content
  return (
    <div className={containerClasses}>
      <BarcodeScannerView
        onScan={handleScan}
      />
      
      {showHeaderAndHelp && (
        <>
          <HelpModal />
          <QuizHeader
            title="Barcode Quiz"
          />
        </>
      )}
      
      {content}
    </div>
  );
}
