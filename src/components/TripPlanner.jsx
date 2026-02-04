import { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { formatDistance } from '../utils/distance';

export default function TripPlanner({
  userPosition,
  onClose
}) {
  const {
    stops,
    currentStopIndex,
    addStop,
    removeStop,
    reorderStops,
    updateStopType,
    startTrip
  } = useTrip();

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderStops(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleStartTrip = () => {
    if (stops.length > 0) {
      startTrip(stops[0]);
      onClose?.();
    }
  };

  const totalDistance = stops.reduce((total, stop, index) => {
    if (index === 0 && userPosition) {
      // Distance from user to first stop
      const { calculateDistance } = require('../utils/distance');
      return total + calculateDistance(
        userPosition.lat, userPosition.lon,
        stop.lat, stop.lon
      );
    } else if (index > 0) {
      // Distance between stops
      const prevStop = stops[index - 1];
      const { calculateDistance } = require('../utils/distance');
      return total + calculateDistance(
        prevStop.lat, prevStop.lon,
        stop.lat, stop.lon
      );
    }
    return total;
  }, 0);

  return (
    <div className="bg-dark-surface rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trip Planner</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {stops.length > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {stops.length} stop{stops.length !== 1 ? 's' : ''} • {formatDistance(totalDistance)} total
          </p>
        )}
      </div>

      {/* Stops list */}
      <div className="p-4">
        {stops.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-gray-400 mb-4">No stops added yet</p>
            <p className="text-sm text-gray-500">
              Add destinations from the map to create a multi-stop trip
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-colors cursor-move
                  ${draggedIndex === index ? 'bg-primary/20' : 'bg-dark-bg'}
                  ${stop.completed ? 'opacity-50' : ''}
                  ${index === currentStopIndex ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Drag handle */}
                <div className="text-gray-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                  </svg>
                </div>

                {/* Stop number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${stop.completed ? 'bg-success' : 'bg-dark-border'}
                `}>
                  {stop.completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Stop info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {stop.name || `Stop ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                  </p>
                </div>

                {/* Type toggle */}
                <button
                  onClick={() => updateStopType(stop.id, stop.type === 'wake' ? 'remind' : 'wake')}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-colors
                    ${stop.type === 'wake'
                      ? 'bg-danger/20 text-danger'
                      : 'bg-secondary/20 text-secondary'
                    }
                  `}
                >
                  {stop.type === 'wake' ? 'Wake' : 'Remind'}
                </button>

                {/* Remove button */}
                <button
                  onClick={() => removeStop(stop.id)}
                  className="p-1 text-gray-500 hover:text-danger"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {stops.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-danger/20 border border-danger" />
              Wake = Loud alarm
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-secondary/20 border border-secondary" />
              Remind = Gentle notification
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {stops.length > 0 && (
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={handleStartTrip}
            className="w-full py-3 bg-primary hover:bg-primary-dark rounded-xl font-bold transition-colors"
          >
            Start Trip
          </button>
        </div>
      )}
    </div>
  );
}

// Mini trip progress indicator
export function TripProgress({ stops, currentIndex }) {
  if (!stops || stops.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {stops.map((stop, index) => (
        <div key={stop.id} className="flex items-center">
          <div
            className={`
              w-3 h-3 rounded-full transition-colors
              ${index < currentIndex ? 'bg-success' : ''}
              ${index === currentIndex ? 'bg-primary animate-pulse' : ''}
              ${index > currentIndex ? 'bg-dark-border' : ''}
            `}
          />
          {index < stops.length - 1 && (
            <div className={`
              w-4 h-0.5
              ${index < currentIndex ? 'bg-success' : 'bg-dark-border'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}
