import { useState } from 'react';

const RADIUS_OPTIONS = [
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' }
];

const WAKE_BEFORE_OPTIONS = [
  { value: 0, label: 'At destination' },
  { value: 1, label: '1 min before' },
  { value: 2, label: '2 min before' },
  { value: 5, label: '5 min before' },
  { value: 10, label: '10 min before' }
];

export default function AlarmControls({
  radius,
  wakeMinutesBefore,
  isArmed,
  destination,
  onRadiusChange,
  onWakeBeforeChange,
  onArm,
  onDisarm
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canArm = destination !== null;

  return (
    <div className="space-y-4">
      {/* Radius selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Alert radius
        </label>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onRadiusChange(option.value)}
              disabled={isArmed}
              className={`
                py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${radius === option.value
                  ? 'bg-primary text-white'
                  : 'bg-dark-surface border border-dark-border text-gray-300 hover:border-primary'
                }
                ${isArmed ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced options toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Smart wake options
      </button>

      {/* Smart wake selector */}
      {showAdvanced && (
        <div className="pl-4 border-l-2 border-dark-border">
          <label className="block text-sm text-gray-400 mb-2">
            Wake me
          </label>
          <div className="space-y-2">
            {WAKE_BEFORE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onWakeBeforeChange(option.value)}
                disabled={isArmed}
                className={`
                  w-full py-2 px-4 rounded-lg text-sm text-left transition-all
                  ${wakeMinutesBefore === option.value
                    ? 'bg-secondary/20 border border-secondary text-secondary'
                    : 'bg-dark-surface border border-dark-border text-gray-300 hover:border-secondary'
                  }
                  ${isArmed ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Smart wake uses your speed to wake you before arrival
          </p>
        </div>
      )}

      {/* Main action button */}
      <button
        onClick={isArmed ? onDisarm : onArm}
        disabled={!canArm && !isArmed}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all btn-press
          ${isArmed
            ? 'bg-danger hover:bg-danger/80'
            : canArm
              ? 'bg-primary hover:bg-primary-dark'
              : 'bg-gray-600 cursor-not-allowed'
          }
        `}
      >
        {isArmed ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Alarm
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Set Alarm
          </span>
        )}
      </button>

      {!canArm && !isArmed && (
        <p className="text-center text-sm text-gray-500">
          Select a destination to set alarm
        </p>
      )}

      {/* Status indicator */}
      {isArmed && (
        <div className="flex items-center justify-center gap-2 text-success">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium">Alarm active</span>
        </div>
      )}
    </div>
  );
}
