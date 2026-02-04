import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to GeoWake',
    description: 'Never miss your stop again. GeoWake wakes you up when you approach your destination.',
    icon: (
      <svg className="w-20 h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    id: 'location',
    title: 'Location Access',
    description: 'We need your location to track your journey and wake you up at the right time. Your location is never stored on our servers.',
    icon: (
      <svg className="w-20 h-20 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    permission: 'location'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Allow notifications so we can alert you even when the app is in the background.',
    icon: (
      <svg className="w-20 h-20 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    permission: 'notifications'
  },
  {
    id: 'tutorial',
    title: 'How to Use',
    description: 'Set your destination, adjust the alarm radius, and start your trip. We\'ll wake you up when you arrive!',
    icon: (
      <svg className="w-20 h-20 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    id: 'install',
    title: 'Install App',
    description: 'For the best experience, add GeoWake to your home screen. This allows it to work like a native app.',
    icon: (
      <svg className="w-20 h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
];

export default function Onboarding({ onComplete }) {
  const { updateSettings } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState({
    location: null,
    notifications: null
  });

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const requestLocationPermission = async () => {
    // Always use getCurrentPosition to trigger the permission prompt on iOS
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location granted:', position.coords);
          setPermissionStatus(prev => ({ ...prev, location: 'granted' }));
          updateSettings({ hasLocationPermission: true });
          resolve(true);
        },
        (error) => {
          console.log('Location error:', error.code, error.message);
          setPermissionStatus(prev => ({ ...prev, location: 'denied' }));
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setPermissionStatus(prev => ({ ...prev, notifications: 'unsupported' }));
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionStatus(prev => ({ ...prev, notifications: 'granted' }));
      updateSettings({ hasNotificationPermission: true });
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionStatus(prev => ({ ...prev, notifications: result }));
      updateSettings({ hasNotificationPermission: result === 'granted' });
      return result === 'granted';
    } catch (e) {
      setPermissionStatus(prev => ({ ...prev, notifications: 'denied' }));
      return false;
    }
  };

  const handleNext = async () => {
    if (step.permission === 'location') {
      await requestLocationPermission();
    } else if (step.permission === 'notifications') {
      await requestNotificationPermission();
    }

    if (isLastStep) {
      updateSettings({ onboardingComplete: true });
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (isLastStep) {
      updateSettings({ onboardingComplete: true });
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const getButtonText = () => {
    if (step.permission === 'location') {
      if (permissionStatus.location === 'granted') return 'Enabled ✓';
      if (permissionStatus.location === 'denied') return 'Denied (Continue)';
      return 'Enable Location';
    }
    if (step.permission === 'notifications') {
      if (permissionStatus.notifications === 'granted') return 'Enabled ✓';
      if (permissionStatus.notifications === 'denied') return 'Denied (Continue)';
      if (permissionStatus.notifications === 'unsupported') return 'Not Supported (Continue)';
      return 'Enable Notifications';
    }
    return isLastStep ? 'Get Started' : 'Continue';
  };

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${index === currentStep ? 'bg-primary' : 'bg-dark-border'}
              ${index < currentStep ? 'bg-success' : ''}
            `}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-8">
          {step.icon}
        </div>

        <h1 className="text-2xl font-bold mb-4">{step.title}</h1>

        <p className="text-gray-400 max-w-sm">
          {step.description}
        </p>

        {/* Permission denied help */}
        {step.permission === 'location' && permissionStatus.location === 'denied' && (
          <div className="mt-4 p-4 bg-warning/20 rounded-xl text-sm text-warning">
            <p className="font-medium">Location access denied</p>
            <p className="mt-1 text-warning/80">
              To enable later, go to your browser settings and allow location access for this site.
            </p>
          </div>
        )}

        {step.permission === 'notifications' && permissionStatus.notifications === 'denied' && (
          <div className="mt-4 p-4 bg-warning/20 rounded-xl text-sm text-warning">
            <p className="font-medium">Notification access denied</p>
            <p className="mt-1 text-warning/80">
              The alarm will still work, but you may miss alerts when the app is in the background.
            </p>
          </div>
        )}

        {/* Install instructions */}
        {step.id === 'install' && (
          <div className="mt-6 text-left bg-dark-surface rounded-xl p-4 text-sm">
            <p className="font-medium mb-2">On iPhone (Safari):</p>
            <p className="text-gray-400 mb-3">Tap Share → "Add to Home Screen"</p>

            <p className="font-medium mb-2">On Android (Chrome):</p>
            <p className="text-gray-400">Tap Menu → "Install app" or "Add to Home screen"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 safe-area-bottom">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-primary hover:bg-primary-dark rounded-xl font-bold text-lg transition-colors mb-3"
        >
          {getButtonText()}
        </button>

        {!isLastStep && step.permission && (
          <button
            onClick={handleSkip}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        )}

        {/* Quick start option on first step */}
        {currentStep === 0 && (
          <button
            onClick={async () => {
              await requestLocationPermission();
              updateSettings({ onboardingComplete: true });
              onComplete();
            }}
            className="w-full py-2 mt-2 text-secondary hover:text-secondary/80 transition-colors text-sm"
          >
            Quick Start (enable location & skip)
          </button>
        )}
      </div>
    </div>
  );
}
