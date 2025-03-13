// Import the QR scanner library
// Note: We'll use npm package instead of unpkg in production
import QrScanner from 'qr-scanner';
import { getQrCodeUrl } from "./store/partyConnection";
import { QR_COMMANDS } from "./store/uiSignals";

// DOM Elements
const video = document.getElementById('qr-video') as HTMLVideoElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const sunIcon = document.getElementById('sun-icon') as HTMLElement;
const moonIcon = document.getElementById('moon-icon') as HTMLElement;
const body = document.body;

// Global state using regular variables since this is vanilla TS
let qrData = '';
let constructedUrl = '';
let wasLastUrlValid = false;

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

// Add a container for scanner overlay effects
const videoContainer = video.parentElement as HTMLDivElement;

// Function to show scan feedback
function showScanFeedback(success = true) {
  if (!videoContainer) return;
  
  const successClass = 'bg-success-100';
  const errorClass = 'bg-error-100';
  
  videoContainer.classList.add(success ? successClass : errorClass);
  setTimeout(() => {
    videoContainer.classList.remove(successClass, errorClass);
  }, 500);
}

// Function to update result with appropriate styling
function updateResult(text: string, isError = false) {
  resultDiv.textContent = text;
  
  const baseClasses = ['p-3', 'rounded-lg', 'mb-4', 'min-h-12', 'text-center', 'transition-colors', 'duration-300', 'font-medium'];
  const stateClasses = {
    normal: ['theme-input', 'theme-text'],
    success: ['bg-success-50', 'dark:bg-success-500/20', 'text-success-600', 'dark:text-success-500'],
    error: ['bg-error-50', 'dark:bg-error-500/20', 'text-error-600', 'dark:text-error-500']
  };
  
  // Remove all state classes
  resultDiv.className = '';
  
  // Add base classes
  baseClasses.forEach(cls => resultDiv.classList.add(cls));
  
  // Add state-specific classes
  const state = isError ? 'error' : (text.includes('Scanned:') ? 'success' : 'normal');
  stateClasses[state].forEach(cls => resultDiv.classList.add(cls));
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
  
  // Use the existing getQrCodeUrl function to construct the URL
  // This will handle the proper formatting for PartyKit
  return getQrCodeUrl(cleanCode);
}

// Function to get user-friendly message for QR codes
function getFriendlyMessage(code: string): string {
  // Convert to lowercase for case-insensitive comparison
  const lowerCode = code.trim().toLowerCase();
  
  // Check if it's a command
  if (lowerCode.startsWith(QR_COMMANDS.PREFIX.toLowerCase())) {
    switch (lowerCode) {
      case QR_COMMANDS.RESET.toLowerCase():
        return "Restarting quiz...";
      case QR_COMMANDS.CLOSE_HELP.toLowerCase():
        return "Closing help menu...";
      case QR_COMMANDS.INSTRUCTIONS.toLowerCase():
        return "Opening help menu...";
      default:
        return `Unknown command: ${code}`;
    }
  }
  
  // For non-command codes (quiz answers), just show the option letter
  return `Selected option ${code.toUpperCase()}`;
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
      
      // Only update UI if validity state changed
      if (isUrlValid !== wasLastUrlValid) {
        if (isUrlValid) {
          enableSubmitButton();
          showScanFeedback(true);
        } else {
          disableSubmitButton();
          showScanFeedback(false);
        }
        wasLastUrlValid = isUrlValid;
      }
      
      // Always update the URL and result text since they're important for UX
      constructedUrl = url;
      updateResult(isUrlValid ? getFriendlyMessage(res.data) : `Invalid code: ${res.data}`, !isUrlValid);
    }
  },
  {
    returnDetailedScanResult: true,
    preferredCamera: 'environment',
    highlightScanRegion: true,
    highlightCodeOutline: true,
  }
);

// Button state functions
function disableSubmitButton() {
  submitBtn.disabled = true;
  submitBtn.classList.remove('bg-accent-500', 'hover:bg-accent-600');
  submitBtn.classList.add('theme-disabled');
}

function enableSubmitButton() {
  submitBtn.disabled = false;
  submitBtn.classList.remove('theme-disabled');
  submitBtn.classList.add('bg-accent-500', 'hover:bg-accent-600');
}

// Set initial state of submit button
disableSubmitButton();

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
    
    fetch(constructedUrl)
      .then(response => response.text())
      .then(data => {
        updateResult(`Option "${qrData}" selected!`);
        console.log('Fetch response:', data);
      })
      .catch(err => {
        updateResult(`Error: ${err}`, true);
        console.error('Fetch error:', err);
      })
      .finally(() => {
        submitBtn.textContent = 'Submit';
        qrData = '';
        constructedUrl = '';
        disableSubmitButton();
      });
  } else {
    updateResult('No valid QR code scanned yet', true);
  }
}); 