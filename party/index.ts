import type * as Party from "partykit/server";
import { generateQuestions } from "./questionGenerator";

// Common headers for all responses
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
} as const;

// Type for quiz questions
interface QuizQuestion {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  isDemo?: boolean;
}

// Helper to create JSON responses
const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    headers: CORS_HEADERS,
    status
  });
};

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Initialize question cache if it doesn't exist
    const cache = await this.room.storage.get<QuizQuestion[]>("questionCache");
    if (!cache || cache.length < 20) {
      try {
        const questions = await generateQuestions(20);
        await this.room.storage.put("questionCache", questions);
      } catch (error) {
        console.error("Failed to initialize question cache:", error);
      }
    }
  }

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
        
        // Try to get questions from cache first
        const cache = await this.room.storage.get<QuizQuestion[]>("questionCache") || [];
        
        if (cache.length >= count) {
          // Use cached questions and remove them from cache
          const questions = cache.slice(0, count);
          const remainingQuestions = cache.slice(count);
          await this.room.storage.put("questionCache", remainingQuestions);
          
          // Generate more questions in background if cache is getting low
          if (remainingQuestions.length < 10) {
            generateQuestions(20).then(async (newQuestions) => {
              await this.room.storage.put("questionCache", [...remainingQuestions, ...newQuestions]);
            }).catch(console.error);
          }
          
          return jsonResponse({ success: true, questions });
        }
        
        // If not enough cached questions, generate new ones
        const questions = await generateQuestions(count);
        
        // Cache any extra questions for future use
        if (questions.length > count) {
          const extraQuestions = questions.slice(count);
          await this.room.storage.put("questionCache", [...cache, ...extraQuestions]);
        }
        
        return jsonResponse({ success: true, questions: questions.slice(0, count) });
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
