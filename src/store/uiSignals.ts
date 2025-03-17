import { signal } from "@preact/signals-react";

// Special command QR codes - using minimal characters for easier scanning
export const QR_COMMANDS = {
  PREFIX: "c:",
  RESET: "c:r",
  CLOSE_HELP: "c:c",
  INSTRUCTIONS: "c:i",
  START_QUIZ: "c:s"
};

// Global UI signals
export const scannerEnabled = signal(true);
export const hideQrCodes = signal(false);
export const helpModalOpen = signal(false);
export const scannerReady = signal(true); 
export const isResetting = signal(false);

// Inactivity timer settings
export const INACTIVITY_DELAY_SECONDS = 5; // Wait 5s before showing countdown
export const INACTIVITY_TIMEOUT_SECONDS = 25; // 25s total timeout
export const inactivityTimeRemaining = signal(INACTIVITY_TIMEOUT_SECONDS);
export const inactivityTimerVisible = signal(false);
