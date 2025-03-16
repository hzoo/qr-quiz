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
