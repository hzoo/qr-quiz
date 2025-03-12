import { signal } from "@preact/signals-react";

// Special command QR codes - using minimal characters for easier scanning
export const QR_COMMANDS = {
  PREFIX: "c:",
  RESET: "c:r",
  SHOW_ANSWERS: "c:s",
  HIDE_ANSWERS: "c:h",
  ANSWERS: "c:a",
  CLOSE_HELP: "c:c",
  INSTRUCTIONS: "c:i"
};

// Global UI signals
export const scannerEnabled = signal(true);
export const hideQrCodes = signal(false);
export const helpModalOpen = signal(false);
export const scannerReady = signal(true); 