import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // let's send a message to the connection
    conn.send(JSON.stringify({ type: "connected", connectionId: conn.id }));
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    // as well as broadcast it to all connections in the room...
    this.room.broadcast(
      message,
      // ...except for the connection it came from (optional, remove this line to send to all)
      // [sender.id]
    );
  }

  // Handle HTTP requests from QR code scans
  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    console.log(`Received request: ${pathname}`);
    
    // Parse the option from the URL
    // Handle the format: /parties/main/{roomId}/{optionId}
    let option: string | null = null;
    
    // Example: /parties/main/quiz/q1a 
    const pathParts = pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 4 && pathParts[0] === 'parties' && pathParts[1] === 'main') {
      // Format: /parties/main/{roomId}/{optionId}
      option = pathParts[3]; // The fourth part is the option ID
      console.log(`Parsed option from standard path: ${option}`);
    } else if (pathParts.length >= 2) {
      // Backward compatibility: /{roomId}/{optionId}
      option = pathParts[1]; // The second part is the option ID
      console.log(`Parsed option from legacy path: ${option}`);
    } else if (pathParts.length === 1) {
      // Format: /{optionId} - No room ID
      option = pathParts[0];
      console.log(`Parsed option directly: ${option}`);
    } else {
      // Try query parameters
      option = url.searchParams.get('choice') || url.searchParams.get('option');
      console.log(`Parsed option from query params: ${option}`);
    }

    console.log(`QR code scan received with option: ${option}`);

    if (option) {
      // Broadcast the option selection to all connected clients
      this.room.broadcast(JSON.stringify({
        type: "selection",
        option,
        timestamp: Date.now()
      }));

      // Extract option letter (if available)
      const optionLetter = option.split('_').pop()?.toUpperCase() || option;

      // Return a nicer response page to the phone browser
      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Barcode Quiz</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #2b2b33;
              color: #ebebf0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
              line-height: 1.6;
            }
            .card {
              background: linear-gradient(135deg, #3d3d47, #2b2b33);
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
              max-width: 400px;
              width: 100%;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e9a178;
              margin-bottom: 20px;
            }
            .option {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background-color: #e9a178;
              color: #2b2b33;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              font-weight: bold;
              font-size: 20px;
              margin-bottom: 20px;
            }
            .close-btn {
              margin-top: 30px;
              background-color: rgba(255, 255, 255, 0.15);
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              color: #ebebf0;
              font-weight: bold;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Option Selected!</h1>
            <div class="option">${optionLetter}</div>
            <p>Your answer has been submitted to the quiz.</p>
            <button class="close-btn" onclick="window.close()">Close This Page</button>
          </div>
          <script>
            // Auto close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `;

      return new Response(htmlResponse, {
        headers: { "Content-Type": "text/html" },
        status: 200
      });
    }

    return new Response("Invalid option", { status: 400 });
  }
}

Server satisfies Party.Worker;
