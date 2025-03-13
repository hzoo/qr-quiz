import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `WebSocket Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // log and broadcast messages to all connections in the room
    console.log(`Message from ${sender.id}: ${message}`);
    this.room.broadcast(message);
  }

  // Handle HTTP requests from QR code scans
  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    console.log(`Received QR scan request: ${pathname}`);
    
    // Expected format from getQrCodeUrl: /parties/main/quiz/{optionId}
    const pathParts = pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 4 && pathParts[0] === 'parties' && pathParts[1] === 'main' && pathParts[2] === 'quiz') {
      const option = pathParts[3]; // The fourth part is the option ID
      // Make command detection case-insensitive by converting to lowercase
      const isCommand = option.toLowerCase().startsWith('c:');
      
      console.log(`Processing ${isCommand ? 'command' : 'option'}: ${option}`);

      // Broadcast the option/command to all connected clients with proper type
      this.room.broadcast(JSON.stringify({
        type: isCommand ? "command" : "selection",
        value: option,
        timestamp: Date.now()
      }));

      // Get the user agent for debugging
      // const userAgent = req.headers.get('user-agent') || 'unknown';
      // console.log(`Request from: ${userAgent}`);

      // Return success response with appropriate message
      return new Response(JSON.stringify({
        success: true,
        message: isCommand ? `Command ${option} processed` : `Option ${option} selected`,
        option: option
      }), {
        headers: { 
          "Content-Type": "application/json",
          // Add CORS headers to support direct browser access
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        },
        status: 200
      });
    }

    console.log(`Invalid URL format: ${pathname}`);
    return new Response(JSON.stringify({ 
      success: false,
      message: "Invalid URL format" 
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      status: 400 
    });
  }
}

Server satisfies Party.Worker;
