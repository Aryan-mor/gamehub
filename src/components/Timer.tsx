"use client";

import { useState, useEffect } from 'react';

interface TimerProps {
  turnStartedAt?: number;
  timeoutDuration?: number;
  isMyTurn: boolean;
  gameStatus: string;
}

export default function Timer({ 
  turnStartedAt, 
  timeoutDuration = 5000, 
  isMyTurn, 
  gameStatus 
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!turnStartedAt || gameStatus !== 'playing') {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - turnStartedAt;
      const remaining = Math.max(0, timeoutDuration - elapsed);
      setTimeLeft(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [turnStartedAt, timeoutDuration, gameStatus]);

  if (gameStatus !== 'playing') {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Calculate percentage for progress bar
  const percentage = Math.max(0, Math.min(100, (timeLeft / timeoutDuration) * 100));

  // Determine color based on time remaining
  let colorClass = 'text-green-600';
  let bgColorClass = 'bg-green-100';
  let progressColorClass = 'bg-green-500';

  if (timeLeft < 30000) { // Less than 30 seconds
    colorClass = 'text-red-600';
    bgColorClass = 'bg-red-100';
    progressColorClass = 'bg-red-500';
  } else if (timeLeft < 60000) { // Less than 1 minute
    colorClass = 'text-yellow-600';
    bgColorClass = 'bg-yellow-100';
    progressColorClass = 'bg-yellow-500';
  }

  return (
    <div className={`${bgColorClass} rounded-lg p-4 border-2 ${isMyTurn ? 'border-blue-500' : 'border-gray-300'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold ${colorClass}`}>
          {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
        </span>
        <span className={`text-lg font-mono font-bold ${colorClass}`}>
          {timeString}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${progressColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isMyTurn && timeLeft < 30000 && (
        <p className="text-red-600 text-sm mt-2 font-medium">
          ⚠️ Make your move soon!
        </p>
      )}
    </div>
  );
} 