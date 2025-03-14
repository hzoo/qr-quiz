import { answerQuestion } from "@/store/quiz";
import { quizState } from "@/store/quiz";

// Handle scan events from the barcode scanner - just handles answers, not commands
export function handleScan(value: string) {
	// Not a command - handle as answer
	// Save the reference to the current question's options before moving to the next
	const currentQuestion =
		quizState.value.questions[quizState.value.currentQuestionIndex];
	const optionIds = currentQuestion?.options.map((option) => option.id) || [];

	// First try exact match
	if (optionIds.includes(value)) {
		answerQuestion(value);
		return;
	}

	// Then try to match just the letter (A, B, C, D) from phone
	const matchingId = optionIds.find((id) => {
		const parts = id.split("_");
		return parts[parts.length - 1] === value;
	});

	if (matchingId) {
		answerQuestion(matchingId);
	}
}
