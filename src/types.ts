export type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  options: Option[];
  isDemo?: boolean;
};

export type QuizState = {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  showResult: boolean;
  lastAnswer: string | null;
  isCorrect: boolean | null;
  isLoading: boolean;
  error: string | null;
}; 