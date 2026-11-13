import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, AlertCircle } from 'lucide-react';

interface InterviewTimerProps {
  initialMinutes?: number;
  onTimeExpired?: () => void;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  initialMinutes = 45,
  onTimeExpired
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(initialMinutes);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onTimeExpired?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, onTimeExpired]);

  const handleSelectDuration = (mins: number) => {
    setSelectedDuration(mins);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Stage assessment
  const elapsed = totalSeconds - remainingSeconds;
  let stageLabel = "1. Clarify constraints & approach";
  if (elapsed > totalSeconds * 0.25 && elapsed <= totalSeconds * 0.7) {
    stageLabel = "2. Implementation in editor";
  } else if (elapsed > totalSeconds * 0.7 && elapsed <= totalSeconds * 0.9) {
    stageLabel = "3. Dry-run edge cases & test execution";
  } else if (elapsed > totalSeconds * 0.9) {
    stageLabel = "4. Big-O complexity & wrap-up";
  }

  // Styling based on time remaining
  const isCritical = remainingSeconds <= 300 && remainingSeconds > 0; // <= 5 mins
  const isWarning = remainingSeconds <= 600 && remainingSeconds > 300; // <= 10 mins

  return (
    <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-white/10 shadow-lg text-xs font-mono">
      <div className="flex items-center space-x-2">
        <Clock className={`w-3.5 h-3.5 ${
          isCritical 
            ? 'text-rose-500 animate-pulse' 
            : isWarning 
              ? 'text-amber-400' 
              : 'text-neutral-400'
        }`} />
        
        <span className={`font-bold tracking-wider text-sm ${
          isCritical 
            ? 'text-rose-400 animate-pulse' 
            : isWarning 
              ? 'text-amber-300' 
              : 'text-white'
        }`}>
          {timeFormatted}
        </span>
      </div>

      {/* Stage Badge */}
      <span className="hidden md:inline text-[11px] font-sans text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
        {stageLabel}
      </span>

      {/* Duration selector */}
      <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
        {[45, 30, 15].map(m => (
          <button
            key={m}
            onClick={() => handleSelectDuration(m)}
            className={`px-1.5 py-0.5 rounded text-[10px] transition ${
              selectedDuration === m 
                ? 'bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-1 pl-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition"
          title={isRunning ? "Pause Timer" : "Start Timer"}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
        </button>

        <button
          onClick={handleReset}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition"
          title="Reset Timer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {isCritical && (
        <span className="flex items-center space-x-1 text-rose-400 text-[10px] font-sans font-semibold">
          <AlertCircle className="w-3 h-3" />
          <span>Final 5m!</span>
        </span>
      )}
    </div>
  );
};
