import { useState } from 'react';

const WAKE_OPTIONS = [
  { value: 0, label: 'At destination', description: 'Wake when entering the radius' },
  { value: 1, label: '1 minute before', description: 'Good for walking' },
  { value: 2, label: '2 minutes before', description: 'Standard for transit' },
  { value: 5, label: '5 minutes before', description: 'Extra time to prepare' },
  { value: 10, label: '10 minutes before', description: 'Maximum advance notice' }
];

export default function SmartWakeSettings({
  currentValue,
  currentSpeed,
  eta,
  onChange,
  disabled = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedOption = WAKE_OPTIONS.find(o => o.value === currentValue) || WAKE_OPTIONS[0];

  const getEstimatedDistance = (minutes) => {
    if (!currentSpeed || currentSpeed < 0.5) return null;
    const meters = currentSpeed * minutes * 60;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-medium">Smart Wake</p>
            <p className="text-sm text-gray-400">{selectedOption.label}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options */}
      {isExpanded && (
        <div className="border-t border-dark-border">
          {/* Explanation */}
          <div className="px-4 py-3 bg-dark-bg/50">
            <p className="text-sm text-gray-400">
              Smart Wake uses your current speed to wake you before you arrive.
              {currentSpeed && currentSpeed > 0.5 && (
                <span className="text-white">
                  {' '}Currently moving at {Math.round(currentSpeed * 3.6)} km/h.
                </span>
              )}
            </p>
          </div>

          {/* Options list */}
          <div className="p-2">
            {WAKE_OPTIONS.map((option) => {
              const estimatedDistance = getEstimatedDistance(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsExpanded(false);
                  }}
                  disabled={disabled}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors mb-1 last:mb-0
                    ${currentValue === option.value
                      ? 'bg-secondary/20 border border-secondary'
                      : 'hover:bg-dark-border/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                    {option.value > 0 && estimatedDistance && (
                      <div className="text-right">
                        <p className="text-sm text-secondary">~{estimatedDistance}</p>
                        <p className="text-xs text-gray-500">before dest.</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual explanation */}
          {currentValue > 0 && (
            <div className="px-4 py-3 border-t border-dark-border">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-primary"
                    style={{ width: `${Math.min(100, currentValue * 10)}%` }}
                  />
                </div>
                <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                You'll be woken {currentValue} min before reaching your destination
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
