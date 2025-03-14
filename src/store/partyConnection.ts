import { signal } from "@preact/signals-react";
import type { PartySocket } from "partysocket";
import { getPartyKitHost } from "../utils/url";
import { handleQrCommand } from "../utils/qrCommands";
import { handleScan } from "../utils/handleScan";

// Signal to track connection status
export const connectionStatus = signal<"disconnected" | "connecting" | "connected">("disconnected");

// Signal to store the current room code
export const roomCode = signal<string>("quiz");

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

// Generate a random 4-letter room code (uppercase letters only)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Initialize the PartyKit connection
export function initPartyConnection(userProvidedRoomId?: string) {
  // Generate a random room code if not provided
  const generatedRoomId = userProvidedRoomId || generateRoomCode();
  
  // Store the room code in the signal so it can be displayed in the UI
  roomCode.value = generatedRoomId;
  
  // Don't initialize if already connected
  if (socket) return;

  // Import PartySocket dynamically to avoid SSR issues
  import("partysocket").then((PartySocketModule) => {
    connectionStatus.value = "connecting";

    // Create the PartySocket connection
    socket = new PartySocketModule.PartySocket({
      host: getPartyKitHost(),
      room: generatedRoomId,
    });

    // Handle connection open
    socket?.addEventListener("open", () => {
      connectionStatus.value = "connected";
      console.log("connected to room", roomCode.value);
    });

    // Handle connection close
    socket?.addEventListener("close", () => {
      connectionStatus.value = "disconnected";
      console.log("disconnected from room", roomCode.value);
    });

    // Handle messages from the server
    socket?.addEventListener("message", (event) => {
      console.log("message from room", roomCode.value, event.data);
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
    // Clear the room code when disconnected
    roomCode.value = "";
  }
}

// Join an existing room using a provided room code
export function joinRoom(code: string) {
  socket?.updateProperties({
    room: code
  });
  socket?.reconnect();
}