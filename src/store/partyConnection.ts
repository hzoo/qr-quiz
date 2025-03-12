import { signal } from "@preact/signals-react";
import type { PartySocket } from "partysocket";

// Signal to track if we're using remote mode (QR codes via phone camera)
export const isRemoteMode = signal(false);

// Initialize remote mode from localStorage if available
if (typeof window !== 'undefined') {
  const savedRemoteMode = localStorage.getItem('remoteMode');
  if (savedRemoteMode !== null) {
    isRemoteMode.value = savedRemoteMode === 'true';
  }
}

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
        
        // No default handler needed - handlers should be registered by consumers
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

// Toggle remote mode
export function toggleRemoteMode() {
  console.log("Toggling remote mode", !isRemoteMode.value);
  isRemoteMode.value = !isRemoteMode.value;
  
  // Save preference to localStorage
  localStorage.setItem("remoteMode", isRemoteMode.value.toString());
  
  if (isRemoteMode.value) {
    initPartyConnection();
  } else {
    disconnectParty();
  }
}

// Get the full URL for a QR code option
export function getQrCodeUrl(optionId: string): string {
  const host = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";
  const protocol = host.includes("localhost") ? "http" : "https";
  
  // Format: https://host/parties/main/roomId/optionId
  return `${protocol}://${host}/parties/main/quiz/${optionId}`;
}

// Create a QR for command codes - conditionally use URL if in remote mode
export function getCommandQrCodeUrl(command: string): string {
  // Only use URL format if in remote mode, otherwise use simple command
  return isRemoteMode.value ? getQrCodeUrl(command) : command;
} 