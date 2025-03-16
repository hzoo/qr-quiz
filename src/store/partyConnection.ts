import { signal } from "@preact/signals-react";
import type { PartySocket } from "partysocket";
import { getPartyKitHost } from "../utils/url";
import { handleQrCommand } from "../utils/qrCommands";
import { handleScan } from "../utils/handleScan";

// Signal to track connection status
export const connectionStatus = signal<"disconnected" | "connecting" | "connected" | "error">("disconnected");

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

// Add reconnection settings
const RECONNECT_DELAY = 1000; // Start with 1 second delay
const MAX_RECONNECT_DELAY = 5000; // Max 5 seconds between attempts
let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;

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
  // Generate a random room code if not provided or empty
  const generatedRoomId = userProvidedRoomId?.trim() ? userProvidedRoomId : generateRoomCode();
  
  // Store the room code in the signal so it can be displayed in the UI
  roomCode.value = generatedRoomId;
  
  // Clear any existing reconnection attempts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Don't initialize if already connected
  if (socket?.readyState === 1) return; // 1 = OPEN

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
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      // console.log("connected to room", roomCode.value);
    });

    // Handle connection close
    socket?.addEventListener("close", (event) => {
      connectionStatus.value = "disconnected";
      // console.log("disconnected from room", roomCode.value);
      
      // Only attempt to reconnect if it wasn't a clean closure
      if (!event.wasClean) {
        const delay = Math.min(RECONNECT_DELAY * (2 ** reconnectAttempts), MAX_RECONNECT_DELAY);
        reconnectTimeout = window.setTimeout(() => {
          reconnectAttempts++;
          initPartyConnection(roomCode.value);
        }, delay);
      }
    });

    // Handle connection errors
    socket?.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      connectionStatus.value = "error";
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
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (socket) {
    socket.close();
    socket = null;
    connectionStatus.value = "disconnected";
    reconnectAttempts = 0;
    // Clear the room code when disconnected
    roomCode.value = "";
  }
}

// Join an existing room using a provided room code
export function joinRoom(code: string) {
  
  // If socket exists, just update the room
  if (socket && socket.readyState !== 3) { // 3 = CLOSED
    socket.updateProperties({
      room: code
    });
    socket.reconnect();
  } else {
    // Otherwise initialize a new connection with this room code
    initPartyConnection(code);
  }
}