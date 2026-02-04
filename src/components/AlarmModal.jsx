import { useState, useEffect } from 'react';
import DismissChallenge from './DismissChallenge';
import { formatDistance } from '../utils/distance';

export default function AlarmModal({
  isOpen,
  destination,
  distance,
  difficulty = 'easy',
  onSnooze,
  onDismiss
}) {
  const [showChallenge, setShowChallenge] = useState(false);
  const [snoozeTime, setSnoozeTime] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowChallenge(false);
      setSnoozeTime(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismissClick = () => {
    if (difficulty === 'easy') {
      onDismiss();
    } else {
      setShowChallenge(true);
    }
  };

  const handleSnooze = (minutes) => {
    setSnoozeTime(minutes);
    onSnooze(minutes);
  };

  const handleChallengeComplete = () => {
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 alarm-flash flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {showChallenge ? (
        <DismissChallenge
          difficulty={difficulty}
          onComplete={handleChallengeComplete}
          onCancel={() => setShowChallenge(false)}
        />
      ) : (
        <>
          {/* Alarm icon */}
          <div className="mb-8 animate-bounce">
            <svg
              className="w-24 h-24 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          {/* Main message */}
          <h1 className="text-4xl font-bold text-center mb-4">
            Wake Up!
          </h1>

          <p className="text-xl text-gray-300 text-center mb-2">
            Approaching destination
          </p>

          {destination?.name && (
            <p className="text-2xl font-semibold text-primary mb-4">
              {destination.name}
            </p>
          )}

          {distance !== null && (
            <div className="bg-dark-surface/50 rounded-xl px-6 py-3 mb-8">
              <span className="text-3xl font-bold">
                {formatDistance(distance)}
              </span>
              <span className="text-gray-400 ml-2">away</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-4">
            {/* Dismiss button */}
            <button
              onClick={handleDismissClick}
              className="w-full py-5 bg-success hover:bg-success/80 rounded-xl font-bold text-xl transition-all btn-press"
            >
              Dismiss Alarm
            </button>

            {/* Snooze buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSnooze(2)}
                className="py-4 bg-dark-surface border border-dark-border hover:border-warning rounded-xl font-medium transition-all btn-press"
              >
                Snooze 2 min
              </button>
              <button
                onClick={() => handleSnooze(5)}
                className="py-4 bg-dark-surface border border-dark-border hover:border-warning rounded-xl font-medium transition-all btn-press"
              >
                Snooze 5 min
              </button>
            </div>
          </div>

          {/* Instructions for hard dismiss */}
          {difficulty !== 'easy' && (
            <p className="text-gray-500 text-sm mt-6 text-center">
              {difficulty === 'medium' && 'Solve a math problem to dismiss'}
              {difficulty === 'hard' && 'Type a phrase to dismiss'}
              {difficulty === 'shake' && 'Shake your phone to dismiss'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
