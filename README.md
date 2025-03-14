# Barcode Quiz

A Q&A trivia application with QR code answers that uses Google's Gemini API to dynamically generate questions. Designed to work with a connected barcode scanner for a fun, interactive quiz experience.

## Features

- Dynamic quiz questions generated by Google's Gemini AI
- QR code answers that can be scanned with a barcode scanner
- Phone mode - use your phone camera to scan QR codes instead of a barcode scanner
- Visual feedback for correct/incorrect answers
- Score tracking
- Responsive design for all devices
- Built with React, TypeScript, and Tailwind CSS v4

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

Run the development server:

```bash
bun dev
```

To run the PartyKit server for remote mode:

```bash
npx partykit dev
```

## Usage

### Scanner Mode (Default)

1. Connect a barcode scanner to your computer
2. Open the application in your browser
3. Scan QR codes to answer questions
4. See your score at the end
5. Scan the "Reset Quiz" QR code to start a new game

### Phone Mode (Remote)

1. Click the "Scanner Mode" button to toggle to "Phone Mode"
2. The app connects to a PartyKit server
3. Use your phone camera to scan the QR codes
4. Each scan will open a URL in your phone browser, which will register the answer
5. The quiz app will update with your selection

### Testing Without a Scanner

- You can click on the options to select answers
- Press Alt+D to show developer tools for simulating scans

## Deployment

To deploy the PartyKit server for production:

```bash
npx partykit deploy
```

Update your `.env` file with the deployed PartyKit URL:

```
VITE_PARTYKIT_HOST=your-app.partykit.dev
```

## Technology Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Preact Signals for state management
- Vite for bundling
- UQR for QR code generation
- PartyKit for remote mode communication
- Google Gemini API for question generation

## License

MIT 