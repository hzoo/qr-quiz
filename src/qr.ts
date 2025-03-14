// Import the QR scanner library
// Note: We'll use npm package instead of unpkg in production
import QrScanner from 'qr-scanner';
import { getQrCommandMessage } from "./utils/qrCommands";
import { createPartyKitFetchUrl, createPartyKitQrCodeUrl } from './utils/url';

// Extract room code from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const currentRoomCode = urlParams.get('room') || 'QUIZ';

console.log('QR Scanner using room:', currentRoomCode);

// DOM Elements
const video = document.getElementById('qr-video') as HTMLVideoElement;
const resultContainer = document.getElementById('result-container') as HTMLDivElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const scanOverlay = document.getElementById('scan-overlay') as HTMLDivElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const sunIcon = document.getElementById('sun-icon') as HTMLElement;
const moonIcon = document.getElementById('moon-icon') as HTMLElement;
const scannerTitle = document.getElementById('scanner-title') as HTMLHeadingElement;
const body = document.body;

// Update scanner title with the current room code
scannerTitle.textContent = `Room: ${currentRoomCode}`;

// Global state using regular variables since this is vanilla TS
let qrData = '';
let constructedUrl = '';
let wasLastUrlValid = false;
let lastScannedCode = '';

// Theme handling
const THEME_KEY = 'qr-scanner-theme';

const initTheme = () => {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    setDarkTheme();
  } else {
    setLightTheme();
  }
  
  // Add event listener for theme toggle
  themeToggle.addEventListener('click', toggleTheme);
};

const setDarkTheme = () => {
  body.classList.remove('light');
  body.classList.add('dark');
  sunIcon.classList.add('hidden');
  moonIcon.classList.remove('hidden');
  localStorage.setItem(THEME_KEY, 'dark');
};

const setLightTheme = () => {
  body.classList.remove('dark');
  body.classList.add('light');
  moonIcon.classList.add('hidden');
  sunIcon.classList.remove('hidden');
  localStorage.setItem(THEME_KEY, 'light');
};

const toggleTheme = () => {
  if (body.classList.contains('dark')) {
    setLightTheme();
  } else {
    setDarkTheme();
  }
};

// Initialize theme as soon as possible
initTheme();

// Function to show scan feedback
function showScanFeedback(success = true, isNewCode = false) {
  if (!scanOverlay) return;
  
  // Different colors for new code vs existing code
  const successClass = isNewCode ? 'bg-accent-500/30' : 'bg-success-500/20';
  const errorClass = 'bg-error-500/20';
  
  scanOverlay.className = `absolute inset-0 pointer-events-none transition-opacity duration-300 ${success ? successClass : errorClass}`;
  scanOverlay.style.opacity = '1';
  
  setTimeout(() => {
    scanOverlay.style.opacity = '0';
  }, 500);
  
  // Show/hide result with slide and fade animations
  if (success) {
    resultDiv.classList.remove('opacity-0', 'translate-y-full');
    // Add a flash animation to the result text for new codes
    if (isNewCode) {
      resultDiv.classList.add('animate-flash');
      setTimeout(() => {
        resultDiv.classList.remove('animate-flash');
      }, 500);
    }
  } else {
    resultDiv.classList.add('opacity-0', 'translate-y-full');
  }
}

// Function to update result with appropriate styling
function updateResult(text: string, isError = false) {
  // First hide the result with transform
  resultDiv.classList.add('opacity-0', 'translate-y-full');
  
  // Use a very short timeout to ensure the transform is applied before showing
  setTimeout(() => {
    resultDiv.textContent = text;
    
    const baseClasses = 'w-full p-3 rounded-lg text-center font-medium transition-all duration-300 backdrop-blur-md text-white text-lg';
    const stateClasses = {
      success: 'bg-accent-500/70',
      error: 'bg-error-500/70'
    };
    
    // Set classes and show the result
    resultDiv.className = `${baseClasses} ${stateClasses[isError ? 'error' : 'success']}`;
    
    // Remove the transform classes to trigger the animation
    requestAnimationFrame(() => {
      resultDiv.classList.remove('opacity-0', 'translate-y-full');
    });
  }, 300);
}

// Function to convert code to URL
function convertCodeToUrl(code: string): string {
  // If the scanned data is already a URL, return it directly
  if (code.startsWith('http')) {
    return code;
  }
  
  // Handle command codes and option codes differently
  let cleanCode = code.trim();
  
  // Check if it's a command code (starts with c:)
  const isCommandCode = cleanCode.toLowerCase().startsWith('c:');
  
  // For option codes, convert to uppercase for consistency
  // For command codes, preserve the case
  if (!isCommandCode) {
    cleanCode = cleanCode.toUpperCase();
  }
  
  return createPartyKitFetchUrl(cleanCode, currentRoomCode);
}

// Initialize QR scanner
const scanner = new QrScanner(
  video,
  (res: QrScanner.ScanResult) => {
    if (res.data) {
      // Store the raw scanned data
      qrData = res.data;
      
      // Convert to URL if needed
      const url = convertCodeToUrl(res.data);
      const isUrlValid = Boolean(url);
      const isNewCode = qrData !== lastScannedCode;
      
      // Only update UI if validity state changed or if it's a new code
      if (isUrlValid !== wasLastUrlValid || isNewCode) {
        if (isUrlValid) {
          enableSubmitButton();
          showScanFeedback(true, isNewCode);
        } else {
          disableSubmitButton();
          showScanFeedback(false);
        }
        wasLastUrlValid = isUrlValid;
        lastScannedCode = qrData;
        
        // Only update result text when something changes
        constructedUrl = url;
        updateResult(isUrlValid ? getQrCommandMessage(res.data) : `Invalid code: ${res.data}`, !isUrlValid);
      }
    }
  },
  {
    maxScansPerSecond: 5,
    returnDetailedScanResult: true,
    preferredCamera: 'environment',
    highlightScanRegion: true,
    highlightCodeOutline: true,
  }
);

// Button state functions
function disableSubmitButton() {
  submitBtn.disabled = true;
  submitBtn.classList.remove('bg-accent-500', 'hover:bg-accent-600', 'hover:scale-[1.02]');
  submitBtn.classList.add('bg-gray-500', 'cursor-not-allowed', 'opacity-50');
}

function enableSubmitButton() {
  submitBtn.disabled = false;
  submitBtn.classList.remove('bg-gray-500', 'cursor-not-allowed', 'opacity-50');
  submitBtn.classList.add('bg-accent-500', 'hover:bg-accent-600', 'hover:scale-[1.02]');
}

// Set initial state of submit button
disableSubmitButton();
scanner.setInversionMode("both");

// Start scanner
scanner.start().catch(err => {
  updateResult(err, true);
  console.error('Scanner start error:', err);
});

// Add click event listener to submit button
submitBtn.addEventListener('click', () => {
  if (constructedUrl) {
    submitBtn.textContent = 'Loading...';
    disableSubmitButton();
    
    // Show the URL being requested in the debug message
    console.log('Attempting to fetch:', constructedUrl);
    
    fetch(constructedUrl, {
      // Add CORS mode to explicitly handle CORS errors
      mode: 'cors',
      // Add credentials if needed (depends on your server setup)
      credentials: 'same-origin'
    })
      .then(response => response.text())
      .then(data => {
        updateResult("Submitted!");
        console.log('Fetch response:', data);
      })
      .catch(err => {
        // More descriptive error message
        let errorMessage = `Error: ${err.message}`;
        
        // Check if it's likely a CORS error
        if (err.message.includes('access') || err.message.includes('CORS') || err.message.includes('failed')) {
          errorMessage = "CORS Error: Can't connect to server";
          console.error('CORS Error details:', err);
          console.info('If you are using HTTPS with an HTTP endpoint, try using HTTP for both or enable CORS on your server.');
        }
        
        updateResult(errorMessage, true);
      })
      .finally(() => {
        submitBtn.textContent = 'Submit';
        qrData = '';
        constructedUrl = '';
        lastScannedCode = '';
        disableSubmitButton();
        // Hide the result container
        resultDiv.classList.add('opacity-0', 'translate-y-full');
      });
  } else {
    updateResult('No valid QR code scanned yet', true);
  }
}); 