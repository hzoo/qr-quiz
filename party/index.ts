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

// Cache configuration
const CACHE_CONFIG = {
  INITIAL_SIZE: 20,    // Initial number of questions to generate
  LOW_THRESHOLD: 50,   // Threshold to trigger background generation
  BATCH_SIZE: 30       // Number of questions to generate in each batch
};

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
    // Initialize question cache specific to this room if it doesn't exist
    const roomId = this.room.id;
    const cacheKey = `questionCache_${roomId}`;
    
    const cache = await this.room.storage.get<QuizQuestion[]>(cacheKey);
    if (!cache || cache.length < CACHE_CONFIG.INITIAL_SIZE) {
      try {
        const questions = await generateQuestions(CACHE_CONFIG.INITIAL_SIZE);
        await this.room.storage.put(cacheKey, questions);
      } catch (error) {
        console.error(`Failed to initialize question cache for room ${roomId}:`, error);
      }
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `WebSocket Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // Log and broadcast messages to all connections in the same room
    console.log(`Message from ${sender.id} in room ${this.room.id}: ${message}`);
    
    // Only broadcast to connections in this room (though PartyKit already does this)
    this.room.broadcast(message);
  }

  // Handle quiz-related endpoints
  private async handleQuizEndpoint(url: URL) {
    // Clean up the pathname by removing empty segments and double slashes
    const cleanPath = url.pathname.replace(/\/+/g, '/');
    const pathParts = cleanPath.split('/').filter(Boolean);
    const roomId = this.room.id; // Get the current room ID
    const cacheKey = `questionCache_${roomId}`;

    // Handle question generation - use cleaned path for comparison
    if (cleanPath === `/parties/main/${roomId}/generate`) {
      try {
        const count = Number.parseInt(new URLSearchParams(url.search).get('count') || '4', 10);
        
        // Try to get questions from room-specific cache first
        const cache = await this.room.storage.get<QuizQuestion[]>(cacheKey) || [];
        
        if (cache.length >= count) {
          // Use cached questions and remove them from cache
          const questions = cache.slice(0, count);
          const remainingQuestions = cache.slice(count);
          await this.room.storage.put(cacheKey, remainingQuestions);
          
          // Generate more questions in background if cache is getting low
          if (remainingQuestions.length < CACHE_CONFIG.LOW_THRESHOLD) {
            generateQuestions(CACHE_CONFIG.BATCH_SIZE).then(async (newQuestions) => {
              await this.room.storage.put(cacheKey, [...remainingQuestions, ...newQuestions]);
              console.log(`Replenished cache for room ${roomId}, new cache size: ${remainingQuestions.length + newQuestions.length}`);
            }).catch(console.error);
          }
          
          return jsonResponse({ success: true, questions });
        }
        
        // If not enough cached questions, generate new ones
        const questions = await generateQuestions(Math.max(count, CACHE_CONFIG.BATCH_SIZE));
        
        // Cache any extra questions for future use
        if (questions.length > count) {
          const extraQuestions = questions.slice(count);
          await this.room.storage.put(cacheKey, [...cache, ...extraQuestions]);
          console.log(`Generated new questions for room ${roomId}, cache size: ${cache.length + extraQuestions.length}`);
        }
        
        return jsonResponse({ success: true, questions: questions.slice(0, count) });
      } catch (error) {
        console.error(`Error generating questions for room ${roomId}:`, error);
        return jsonResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate questions'
        }, 500);
      }
    }

    // Handle option/command selection
    if (pathParts.length >= 4 && pathParts[2] === roomId) {
      const option = pathParts[3];
      const isCommand = option.toLowerCase().startsWith('c:');
      
      console.log(`Processing ${isCommand ? 'command' : 'option'} in room ${roomId}: ${option}`);

      // Broadcast to all connections in this room
      this.room.broadcast(JSON.stringify({
        type: isCommand ? "command" : "selection",
        value: option,
        timestamp: Date.now(),
        roomId: roomId
      }));

      return jsonResponse({
        success: true,
        message: isCommand ? `Command ${option} processed` : `Option ${option} selected`,
        option,
        roomId
      });
    }

    return jsonResponse({ 
      success: false,
      message: "Invalid URL format or room mismatch" 
    }, 400);
  }

  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    console.log(`Received request for room ${this.room.id}: ${url.pathname}`);
    
    return this.handleQuizEndpoint(url);
  }
}

Server satisfies Party.Worker;
