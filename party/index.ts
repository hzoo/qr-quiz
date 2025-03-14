import type * as Party from "partykit/server";
import { generateQuestions } from "./questionGenerator";

// Common headers for all responses
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
} as const;

// Helper to create JSON responses
const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    headers: CORS_HEADERS,
    status
  });
};

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `WebSocket Connected:
  id: ${conn.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // log and broadcast messages to all connections in the room
    console.log(`Message from ${sender.id}: ${message}`);
    this.room.broadcast(message);
  }

  // Handle quiz-related endpoints
  private async handleQuizEndpoint(url: URL) {
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Handle question generation
    if (url.pathname === '/parties/main/quiz/generate') {
      try {
        const count = Number.parseInt(new URLSearchParams(url.search).get('count') || '4', 10);
        const questions = await generateQuestions(count);
        return jsonResponse({ success: true, questions });
      } catch (error) {
        console.error('Error generating questions:', error);
        return jsonResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate questions'
        }, 500);
      }
    }

    // Handle option/command selection
    if (pathParts.length >= 4 && pathParts[2] === 'quiz') {
      const option = pathParts[3];
      const isCommand = option.toLowerCase().startsWith('c:');
      
      console.log(`Processing ${isCommand ? 'command' : 'option'}: ${option}`);

      this.room.broadcast(JSON.stringify({
        type: isCommand ? "command" : "selection",
        value: option,
        timestamp: Date.now()
      }));

      return jsonResponse({
        success: true,
        message: isCommand ? `Command ${option} processed` : `Option ${option} selected`,
        option
      });
    }

    return jsonResponse({ 
      success: false,
      message: "Invalid URL format" 
    }, 400);
  }

  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    console.log(`Received request: ${url.pathname}`);
    
    return this.handleQuizEndpoint(url);
  }
}

Server satisfies Party.Worker;
