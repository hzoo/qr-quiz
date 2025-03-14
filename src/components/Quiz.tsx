import type { ReactNode } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { 
  quizState,
} from "@/store/quiz";

import { QuizHeader } from "./Quiz/QuizHeader";
import { QuizErrorView } from "./Quiz/QuizErrorView";
import { QuizResultsView } from "./Quiz/QuizResultsView";
import { QuizQuestionView } from "./Quiz/QuizQuestionView";
import { HelpModal } from "./Quiz/HelpModal";
import { BarcodeScannerView } from "./Quiz/BarcodeScannerView";

export function Quiz() {
  useSignals();

  const { error, questions, currentQuestionIndex, showResult } = quizState.value;
  const currentQuestion = questions[currentQuestionIndex];

  let content: ReactNode;
  const showHeaderAndHelp = currentQuestion && !error;

  if (error) {
    content = <QuizErrorView error={error} />;
  } else if (showResult) {
    content = <QuizResultsView />;
  } else {
    content = <QuizQuestionView />;
  }

  return (
    <div className="flex flex-col h-screen min-h-0 bg-[#1e1e24] text-[#ebebf0]">
      <div className="flex-none">
        <BarcodeScannerView/>
        
        {showHeaderAndHelp && (
          <>
            <HelpModal />
            <QuizHeader
              title="Barcode Quiz"
            />
          </>
        )}
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden h-[calc(100vh-112px)]">
        {content}
      </div>
    </div>
  );
}
