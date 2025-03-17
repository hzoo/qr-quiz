import { useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { 
  inactivityTimeRemaining, 
  inactivityTimerVisible,
  INACTIVITY_DELAY_SECONDS,
  INACTIVITY_TIMEOUT_SECONDS
} from "@/store/uiSignals";
import { quizStarted } from "@/store/quiz";

export function InactivityTimer() {
  useSignals();

  useEffect(() => {
    if (!quizStarted.value) return;

    let inactivityTimeout: number | null = null;
    let countdownInterval: number | null = null;
    
    const resetTimer = () => {
      // Clear any existing timers
      if (inactivityTimeout) window.clearTimeout(inactivityTimeout);
      if (countdownInterval) window.clearInterval(countdownInterval);
      
      // Reset timer state
      inactivityTimerVisible.value = false;
      inactivityTimeRemaining.value = INACTIVITY_TIMEOUT_SECONDS;
      
      // Set new delay before starting countdown
      inactivityTimeout = window.setTimeout(() => {
        // Show countdown
        inactivityTimerVisible.value = true;
        
        countdownInterval = window.setInterval(() => {
          inactivityTimeRemaining.value--;
          
          if (inactivityTimeRemaining.value <= 0) {
            window.location.reload();
          }
        }, 1000);
      }, INACTIVITY_DELAY_SECONDS * 1000);
    };

    // Track user activity
    const userActivityEvents = [
      'mousemove', 'mousedown', 'keypress', 'touchstart', 'click'
    ];
    
    const handleUserActivity = () => resetTimer();
    
    // Add event listeners
    userActivityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Start initial timer
    resetTimer();
    
    // Cleanup
    return () => {
      userActivityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimeout) window.clearTimeout(inactivityTimeout);
      if (countdownInterval) window.clearInterval(countdownInterval);
    };
  }, []); // Remove dependency since we check quizStarted inside effect
  
  return null;
} 