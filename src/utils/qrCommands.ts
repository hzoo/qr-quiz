import { isResetting, QR_COMMANDS } from "@/store/uiSignals";
import { helpModalOpen } from "@/store/uiSignals";
import { restartQuiz } from "@/store/quiz";
import { initQuiz, quizStarted } from "@/store/quiz";
import { scannerEnabled } from "@/store/uiSignals";
import { connectionStatus } from "@/store/partyConnection";

type QrCommand = {
  id: string;
  message: string;
  handler: () => void;
};

// Single source of truth for all QR commands
const QR_COMMAND_MAP: Record<string, QrCommand> = {
  [QR_COMMANDS.RESET.toLowerCase()]: {
    id: QR_COMMANDS.RESET,
    message: "Restart Quiz",
    handler: () => {
      isResetting.value = true;
      setTimeout(() => {
        restartQuiz();
        isResetting.value = false;
      }, 350);
    }
  },
  [QR_COMMANDS.CLOSE_HELP.toLowerCase()]: {
    id: QR_COMMANDS.CLOSE_HELP,
    message: "Close Help Menu",
    handler: () => {
      console.log("Close help command detected");
      helpModalOpen.value = false;
    }
  },
  [QR_COMMANDS.INSTRUCTIONS.toLowerCase()]: {
    id: QR_COMMANDS.INSTRUCTIONS,
    message: "Open Help Menu",
    handler: () => {
      console.log("Instructions command detected");
      helpModalOpen.value = true;
    }
  },
  [QR_COMMANDS.START_QUIZ.toLowerCase()]: {
    id: QR_COMMANDS.START_QUIZ,
    message: "Start Quiz",
    handler: () => {
      console.log("Start quiz command detected");
      if (connectionStatus.value === "connected") {
        scannerEnabled.value = true;
        initQuiz();
        quizStarted.value = true;
      } else {
        console.log("Cannot start quiz: not connected");
      }
    }
  }
};

/**
 * Handles QR command codes and returns whether the code was a command
 * @param value The scanned QR code value
 * @returns true if the code was a command and was handled, false otherwise
 */
export function handleQrCommand(value: string): boolean {
  // Check if the scanned value is a special command
  // Use lowercase comparison to handle case insensitivity 
  if (!value.toLowerCase().startsWith(QR_COMMANDS.PREFIX.toLowerCase())) {
    return false;
  }

  // Convert value to lowercase for case-insensitive command matching
  const lowerValue = value.toLowerCase();
  
  // Get command from map
  const command = QR_COMMAND_MAP[lowerValue];
  if (command) {
    command.handler();
  } else {
    console.log("Unknown command", value);
  }

  return true;
}

/**
 * Gets a user-friendly message for a QR code
 * @param code The scanned QR code value
 * @returns A user-friendly message describing what the code does
 */
export function getQrCommandMessage(code: string): string {
  // Convert to lowercase for case-insensitive comparison
  const lowerCode = code.trim().toLowerCase();
  
  // Check if it's a command
  if (lowerCode.startsWith(QR_COMMANDS.PREFIX.toLowerCase())) {
    const command = QR_COMMAND_MAP[lowerCode];
    return command?.message ?? `Unknown command: ${code}`;
  }
  
  // For non-command codes (quiz answers), just show the option letter
  return `Pick ${code.toUpperCase()}`;
} 