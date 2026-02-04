import { calculateDestinationPoint, calculateDistance } from './distance';

const MAX_PREDICTION_TIME = 300; // 5 minutes max prediction
const CONFIDENCE_DECAY_RATE = 0.1; // 10% confidence loss per second without GPS

export function createTrajectoryPredictor() {
  let lastKnownPosition = null;
  let lastKnownSpeed = 0;
  let lastKnownHeading = 0;
  let lastUpdateTime = null;
  let gpsLostTime = null;

  return {
    update(lat, lon, speed, heading, timestamp) {
      lastKnownPosition = { lat, lon };
      lastKnownSpeed = speed || 0;
      lastKnownHeading = heading || 0;
      lastUpdateTime = timestamp || Date.now();
      gpsLostTime = null;
    },

    markGpsLost() {
      if (!gpsLostTime) {
        gpsLostTime = Date.now();
      }
    },

    markGpsRestored() {
      gpsLostTime = null;
    },

    getPredictedPosition(currentTime = Date.now()) {
      if (!lastKnownPosition || !lastUpdateTime) {
        return null;
      }

      const timeSinceUpdate = (currentTime - lastUpdateTime) / 1000;

      // Don't predict beyond max time
      if (timeSinceUpdate > MAX_PREDICTION_TIME) {
        return {
          ...lastKnownPosition,
          confidence: 0,
          isPredicted: true,
          predictionAge: timeSinceUpdate
        };
      }

      // If stationary, return last known position
      if (lastKnownSpeed < 0.5) {
        return {
          ...lastKnownPosition,
          confidence: Math.max(0, 1 - timeSinceUpdate * 0.05),
          isPredicted: timeSinceUpdate > 0,
          predictionAge: timeSinceUpdate
        };
      }

      // Calculate predicted position based on speed and heading
      const distanceTraveled = lastKnownSpeed * timeSinceUpdate;
      const predicted = calculateDestinationPoint(
        lastKnownPosition.lat,
        lastKnownPosition.lon,
        lastKnownHeading,
        distanceTraveled
      );

      // Calculate confidence (decreases over time)
      const confidence = Math.max(0, 1 - timeSinceUpdate * CONFIDENCE_DECAY_RATE);

      return {
        lat: predicted.lat,
        lon: predicted.lon,
        confidence,
        isPredicted: true,
        predictionAge: timeSinceUpdate,
        estimatedSpeed: lastKnownSpeed,
        estimatedHeading: lastKnownHeading
      };
    },

    getConfidence() {
      if (!gpsLostTime) return 1;

      const timeLost = (Date.now() - gpsLostTime) / 1000;
      return Math.max(0, 1 - timeLost * CONFIDENCE_DECAY_RATE);
    },

    isGpsLost() {
      return gpsLostTime !== null;
    },

    getTimeSinceGpsLost() {
      if (!gpsLostTime) return 0;
      return (Date.now() - gpsLostTime) / 1000;
    },

    shouldAlertUser() {
      // Alert if GPS has been lost for more than 30 seconds
      return this.isGpsLost() && this.getTimeSinceGpsLost() > 30;
    },

    estimateTimeToDestination(destLat, destLon) {
      const predicted = this.getPredictedPosition();
      if (!predicted || lastKnownSpeed < 0.5) {
        return null;
      }

      const distance = calculateDistance(
        predicted.lat, predicted.lon,
        destLat, destLon
      );

      return {
        seconds: distance / lastKnownSpeed,
        distance,
        confidence: predicted.confidence
      };
    },

    reset() {
      lastKnownPosition = null;
      lastKnownSpeed = 0;
      lastKnownHeading = 0;
      lastUpdateTime = null;
      gpsLostTime = null;
    }
  };
}

export function interpolatePosition(pos1, pos2, fraction) {
  return {
    lat: pos1.lat + (pos2.lat - pos1.lat) * fraction,
    lon: pos1.lon + (pos2.lon - pos1.lon) * fraction
  };
}
