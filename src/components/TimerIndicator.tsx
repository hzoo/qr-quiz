import { useSignals } from "@preact/signals-react/runtime";
import { inactivityTimerVisible, inactivityTimeRemaining, INACTIVITY_TIMEOUT_SECONDS } from "@/store/uiSignals";

export function TimerIndicator() {
  useSignals();
  
  if (!inactivityTimerVisible.value) {
    return null;
  }
  
  const seconds = inactivityTimeRemaining.value;
  const percentage = (seconds / INACTIVITY_TIMEOUT_SECONDS) * 100; // Use the constant instead of hardcoded 30
  
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-300">
        Reset in: {seconds}s
      </div>
      <div className="w-20 h-2 bg-[#2b2b33] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#e9a178] transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
} 