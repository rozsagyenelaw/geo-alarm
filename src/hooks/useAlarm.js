import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateDistance, isWithinRadius } from '../utils/distance';
import {
  createAlarmSound,
  vibrate,
  stopVibration,
  createVibrationPattern,
  resumeAudioContext,
  requestWakeLock
} from '../utils/alarmSounds';
import { shouldTriggerSmartWake } from '../utils/arrivalEstimate';

const ALARM_STATES = {
  IDLE: 'idle',
  ARMED: 'armed',
  TRIGGERED: 'triggered',
  SNOOZED: 'snoozed',
  DISMISSED: 'dismissed'
};

export function useAlarm(settings = {}) {
  const {
    defaultRadius = 500,
    defaultWakeMinutesBefore = 0,
    dismissDifficulty = 'easy',
    enableVibration = true,
    enableSound = true,
    enableEscalation = true,
    escalationDuration = 30,
    soundType = 'loud'
  } = settings;

  const [state, setState] = useState(ALARM_STATES.IDLE);
  const [destination, setDestination] = useState(null);
  const [radius, setRadius] = useState(defaultRadius);
  const [wakeMinutesBefore, setWakeMinutesBefore] = useState(defaultWakeMinutesBefore);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [snoozeEndTime, setSnoozeEndTime] = useState(null);

  const alarmSoundRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const snoozeTimeoutRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Request wake lock when alarm is armed
  useEffect(() => {
    if (state === ALARM_STATES.ARMED) {
      requestWakeLock().then(lock => {
        wakeLockRef.current = lock;
      });
    } else if (state === ALARM_STATES.IDLE || state === ALARM_STATES.DISMISSED) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [state]);

  const arm = useCallback(async (dest, options = {}) => {
    if (!dest || !dest.lat || !dest.lon) {
      throw new Error('Invalid destination');
    }

    // Resume audio context (requires user interaction)
    await resumeAudioContext();

    setDestination(dest);
    if (options.radius) setRadius(options.radius);
    if (options.wakeMinutesBefore !== undefined) {
      setWakeMinutesBefore(options.wakeMinutesBefore);
    }

    setState(ALARM_STATES.ARMED);
  }, []);

  const disarm = useCallback(() => {
    stopAlarmEffects();
    setState(ALARM_STATES.IDLE);
    setDestination(null);
    setCurrentDistance(null);
    setSnoozeEndTime(null);

    if (snoozeTimeoutRef.current) {
      clearTimeout(snoozeTimeoutRef.current);
      snoozeTimeoutRef.current = null;
    }
  }, []);

  const trigger = useCallback(() => {
    setState(ALARM_STATES.TRIGGERED);

    // Start alarm sound
    if (enableSound) {
      alarmSoundRef.current = createAlarmSound(soundType, 0.3);
      alarmSoundRef.current.start();

      if (enableEscalation) {
        alarmSoundRef.current.startEscalation(escalationDuration);
      }
    }

    // Start vibration
    if (enableVibration && 'vibrate' in navigator) {
      const pattern = createVibrationPattern(enableEscalation ? 'escalating' : 'intense');
      vibrationIntervalRef.current = setInterval(() => {
        vibrate(pattern);
      }, pattern.reduce((a, b) => a + b, 0));
    }

    // Request notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GeoWake', {
        body: 'You are approaching your destination!',
        icon: '/icons/icon-192x192.png',
        tag: 'geowake-alarm',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
    }
  }, [enableSound, enableVibration, enableEscalation, escalationDuration, soundType]);

  const stopAlarmEffects = useCallback(() => {
    if (alarmSoundRef.current) {
      alarmSoundRef.current.stop();
      alarmSoundRef.current = null;
    }

    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    stopVibration();
  }, []);

  const snooze = useCallback((minutes = 2) => {
    stopAlarmEffects();
    setState(ALARM_STATES.SNOOZED);

    const endTime = Date.now() + minutes * 60 * 1000;
    setSnoozeEndTime(endTime);

    snoozeTimeoutRef.current = setTimeout(() => {
      trigger();
    }, minutes * 60 * 1000);
  }, [trigger, stopAlarmEffects]);

  const dismiss = useCallback(() => {
    stopAlarmEffects();
    setState(ALARM_STATES.DISMISSED);
    setSnoozeEndTime(null);

    if (snoozeTimeoutRef.current) {
      clearTimeout(snoozeTimeoutRef.current);
      snoozeTimeoutRef.current = null;
    }
  }, [stopAlarmEffects]);

  const checkPosition = useCallback((userLat, userLon, speed = 0) => {
    if (!destination || state !== ALARM_STATES.ARMED) {
      return;
    }

    const distance = calculateDistance(
      userLat, userLon,
      destination.lat, destination.lon
    );
    setCurrentDistance(distance);

    // Check smart wake (time-based)
    if (wakeMinutesBefore > 0 && speed > 0) {
      if (shouldTriggerSmartWake(
        userLat, userLon,
        destination.lat, destination.lon,
        speed,
        wakeMinutesBefore
      )) {
        trigger();
        return;
      }
    }

    // Check radius-based trigger
    if (isWithinRadius(userLat, userLon, destination.lat, destination.lon, radius)) {
      trigger();
    }
  }, [destination, state, radius, wakeMinutesBefore, trigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarmEffects();
      if (snoozeTimeoutRef.current) {
        clearTimeout(snoozeTimeoutRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [stopAlarmEffects]);

  return {
    state,
    destination,
    radius,
    wakeMinutesBefore,
    currentDistance,
    snoozeEndTime,
    dismissDifficulty,
    isArmed: state === ALARM_STATES.ARMED,
    isTriggered: state === ALARM_STATES.TRIGGERED,
    isSnoozed: state === ALARM_STATES.SNOOZED,
    arm,
    disarm,
    trigger,
    snooze,
    dismiss,
    checkPosition,
    setRadius,
    setWakeMinutesBefore,
    ALARM_STATES
  };
}

export default useAlarm;
