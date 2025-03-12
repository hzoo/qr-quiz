import { signal } from "@preact/signals-react";
import type { PartySocket } from "partysocket";

// Signal to track connection status
export const connectionStatus = signal<"disconnected" | "connecting" | "connected">("disconnected");

// Store the PartySocket instance
let socket: PartySocket | null = null;

// Type definition for message handlers
export type MessageData = {
  type: string;
  option?: string;
  timestamp?: number;
  connectionId?: string;
  message?: string;
  success?: boolean;
};

type MessageCallback = (data: MessageData) => void;

// Store message handlers
const messageHandlers: MessageCallback[] = [];

// Add a message handler
export function addMessageHandler(callback: MessageCallback) {
  messageHandlers.push(callback);
}

// Remove a message handler
export function removeMessageHandler(callback: MessageCallback) {
  const index = messageHandlers.indexOf(callback);
  if (index !== -1) {
    messageHandlers.splice(index, 1);
  }
}

// Initialize the PartyKit connection
export function initPartyConnection(roomId = "quiz") {
  // Don't initialize if already connected
  if (socket) return;

  // Import PartySocket dynamically to avoid SSR issues
  import("partysocket").then((PartySocketModule) => {
    connectionStatus.value = "connecting";

    // Create the PartySocket connection
    socket = new PartySocketModule.PartySocket({
      host: import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999",
      room: roomId,
    });

    // Handle connection open
    socket?.addEventListener("open", () => {
      console.log("Connected to PartyKit server");
      connectionStatus.value = "connected";
    });

    // Handle connection close
    socket?.addEventListener("close", () => {
      console.log("Disconnected from PartyKit server");
      connectionStatus.value = "disconnected";
    });

    // Handle messages from the server
    socket?.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (messageHandlers.length === 0) {
          console.warn("PartyKit message received but no handlers registered:", data);
          return;
        }
        
        // Notify all registered handlers
        messageHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error("Error in message handler:", error);
          }
        });
      } catch (error) {
        console.error("Error parsing message:", error);
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
  const host = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";
  const protocol = host.includes("localhost") ? "http" : "https";
  
  // Format: https://host/parties/main/roomId/optionId
  return `${protocol}://${host}/parties/main/quiz/${optionId}`;
} 