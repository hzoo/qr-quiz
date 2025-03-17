import type { ReactNode } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { 
  quizState,
  quizStarted
} from "@/store/quiz";

import { QuizHeader } from "./Quiz/QuizHeader";
import { QuizErrorView } from "./Quiz/QuizErrorView";
import { QuizResultsView } from "./Quiz/QuizResultsView";
import { QuizQuestionView } from "./Quiz/QuizQuestionView";
import { QuizWelcomeView } from "./Quiz/QuizWelcomeView";
import { HelpModal } from "./Quiz/HelpModal";
import { InactivityTimer } from "./InactivityTimer";
import { TimerIndicator } from "./TimerIndicator";

export function Quiz() {
  useSignals();

  const { error, questions, currentQuestionIndex, showResult } = quizState.value;
  const currentQuestion = questions[currentQuestionIndex];

  // If quiz hasn't started yet, show the welcome view
  if (!quizStarted.value || questions.length === 0) {
    return <QuizWelcomeView />;
  }

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
      {/* This component handles the inactivity timer logic */}
      <InactivityTimer />
      
      <div className="flex-none">
        {showHeaderAndHelp && (
          <>
            <HelpModal />
            <QuizHeader
              title="Barcode Quiz"
              rightContent={<TimerIndicator />}
            />
          </>
        )}
      </div>
      {content}
    </div>
  );
}
