import { useMemo } from 'react';
import { formatDistance } from '../utils/distance';
import { formatETA } from '../utils/arrivalEstimate';

export default function DistanceDisplay({
  distance,
  eta,
  speed,
  isMoving,
  showSpeed = true,
  compact = false
}) {
  const formattedDistance = useMemo(() => {
    if (distance === null || distance === undefined) return '--';
    return formatDistance(distance);
  }, [distance]);

  const formattedETA = useMemo(() => {
    if (!eta || !isMoving) return null;
    return formatETA(eta);
  }, [eta, isMoving]);

  const formattedSpeed = useMemo(() => {
    if (!speed || speed < 0.5) return null;
    const kmh = speed * 3.6;
    return `${Math.round(kmh)} km/h`;
  }, [speed]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-lg">{formattedDistance}</span>
        {formattedETA && (
          <span className="text-gray-400">~{formattedETA}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-xl p-4 border border-dark-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">Distance</p>
          <p className="text-3xl font-bold">{formattedDistance}</p>
        </div>

        {formattedETA && (
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">ETA</p>
            <p className="text-2xl font-bold text-primary">{formattedETA}</p>
          </div>
        )}
      </div>

      {showSpeed && (
        <div className="mt-3 pt-3 border-t border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMoving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-gray-400">Moving</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-sm text-gray-400">Stationary</span>
              </>
            )}
          </div>

          {formattedSpeed && (
            <span className="text-sm font-medium">{formattedSpeed}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function MinimalDistanceDisplay({ distance, isAlarmActive }) {
  const formattedDistance = formatDistance(distance || 0);

  return (
    <div className={`
      fixed top-4 left-1/2 -translate-x-1/2 z-50
      px-4 py-2 rounded-full
      ${isAlarmActive ? 'bg-primary' : 'bg-dark-surface/90'}
      backdrop-blur-sm border border-dark-border
      shadow-lg
    `}>
      <span className="text-lg font-bold">{formattedDistance}</span>
    </div>
  );
}
