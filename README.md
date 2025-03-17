# Barcode Quiz

Q&A trivia app using QR codes. Either use a dedicated phone app or a connected barcode scanner.

## Features

- All questions generated via Gemini
- Barcode scanner acts as a "camera keyboard" so it types out what it sees and presses enter.
- Phone app "/qr.html": scans + sends a fetch request to the backend to select an option.
 
## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up your Google Gemini API key:
   - Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Copy `.env.example` to `.env` and add your API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

## Development

```bash
bun run dev
# local server
bun run partykit
```

## Deployment

```bash
# add env VITE_PARTYKIT_HOST=your-app.partykit.dev
bunx partykit deploy
bunx partykit deploy:cf
```
