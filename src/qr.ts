// Import the QR scanner library
// Note: We'll use npm package instead of unpkg in production
import QrScanner from 'qr-scanner';

// DOM Elements
const video = document.getElementById('qr-video') as HTMLVideoElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const sunIcon = document.getElementById('sun-icon') as HTMLElement;
const moonIcon = document.getElementById('moon-icon') as HTMLElement;
const body = document.body;

let qrData = '';

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

// Initialize QR scanner
const scanner = new QrScanner(
  video,
  (res: QrScanner.ScanResult) => {
    if (res.data) {
      qrData = res.data;
      const isUrl = res.data.startsWith('http');
      updateResult(`Scanned: ${isUrl ? 'URL' : res.data}`);
      showScanFeedback(true);
      
      // Enable submit button if it's a URL
      if (isUrl) {
        enableSubmitButton();
      }
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
  updateResult(`Camera error: ${err.message}`, true);
  console.error('Scanner start error:', err);
});

// Add click event listener to submit button
submitBtn.addEventListener('click', () => {
  if (qrData) {
    submitBtn.textContent = 'Loading...';
    disableSubmitButton();
    
    fetch(qrData)
      .then(response => response.text())
      .then(data => {
        updateResult(`Submitted: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`);
        console.log('Fetch response:', data);
      })
      .catch(err => {
        updateResult(`Fetch error: ${err}`, true);
        console.error('Fetch error:', err);
      })
      .finally(() => {
        submitBtn.textContent = 'Submit';
        enableSubmitButton();
      });
  } else {
    updateResult('No QR code scanned yet', true);
  }
}); 