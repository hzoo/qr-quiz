import { signal } from "@preact/signals-react";
import type { PartySocket } from "partysocket";
import { getPartyKitHost, createPartyKitQrCodeUrl } from "../utils/url";
import { handleQrCommand } from "../utils/qrCommands";
import { handleScan } from "../utils/handleScan";

// Signal to track connection status
export const connectionStatus = signal<"disconnected" | "connecting" | "connected">("disconnected");

// Store the PartySocket instance
let socket: PartySocket | null = null;

// Type definition for message data
export type MessageData = {
  type: "command" | "selection";
  value?: string;
  timestamp?: number;
  connectionId?: string;
  message?: string;
  success?: boolean;
};

// Initialize the PartyKit connection
export function initPartyConnection(roomId = "quiz") {
  // Don't initialize if already connected
  if (socket) return;

  // Import PartySocket dynamically to avoid SSR issues
  import("partysocket").then((PartySocketModule) => {
    connectionStatus.value = "connecting";

    // Create the PartySocket connection
    socket = new PartySocketModule.PartySocket({
      host: getPartyKitHost(),
      room: roomId,
    });

    // Handle connection open
    socket?.addEventListener("open", () => {
      connectionStatus.value = "connected";
    });

    // Handle connection close
    socket?.addEventListener("close", () => {
      connectionStatus.value = "disconnected";
    });

    // Handle messages from the server
    socket?.addEventListener("message", (event) => {
      try {
        const data: MessageData = JSON.parse(event.data);
        
        if (data.type === "command" && data.value) {
          // Use our centralized command handler
          handleQrCommand(data.value);
        } else if (data.type === "selection" && data.value) {
          // Handle regular quiz answers
          handleScan(data.value);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
  });
}

// Disconnect from the PartyKit server
export function disconnectParty() {
  if (socket) {
    socket.close();
    socket = null;
    connectionStatus.value = "disconnected";
  }
}

// Get the URL for a QR code option
// This converts a simple code to the appropriate PartyKit URL
export function getQrCodeUrl(optionId: string): string {
  return createPartyKitQrCodeUrl(optionId);
} 