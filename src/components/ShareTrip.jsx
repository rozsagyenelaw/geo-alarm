import { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { useSettings } from '../context/SettingsContext';

export default function ShareTrip({
  destination,
  userPosition,
  onClose
}) {
  const { shareTrip, sharedWith } = useTrip();
  const { settings } = useSettings();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState(settings.emergencyContact?.phone || '');
  const [autoCheckIn, setAutoCheckIn] = useState(settings.autoCheckIn);
  const [shareMethod, setShareMethod] = useState('sms');

  const generateShareMessage = () => {
    const destName = destination?.name || 'my destination';
    const coords = destination ? `${destination.lat.toFixed(6)},${destination.lon.toFixed(6)}` : '';
    const mapsLink = `https://www.google.com/maps?q=${coords}`;

    return `I'm heading to ${destName}. I'll be notified when I arrive.\n\nDestination: ${mapsLink}\n\nSent via GeoWake`;
  };

  const handleShare = async () => {
    const message = generateShareMessage();

    if (shareMethod === 'sms' && contactPhone) {
      window.location.href = `sms:${contactPhone}?body=${encodeURIComponent(message)}`;
      shareTrip({ name: contactName, phone: contactPhone });
    } else if (shareMethod === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Trip - GeoWake',
          text: message
        });
        shareTrip({ name: 'Shared' });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else if (shareMethod === 'copy') {
      try {
        await navigator.clipboard.writeText(message);
        alert('Trip details copied to clipboard!');
        shareTrip({ name: 'Copied' });
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }

    onClose?.();
  };

  const canUseNativeShare = 'share' in navigator;

  return (
    <div className="bg-dark-surface rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share Trip</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Let someone know about your trip
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Destination preview */}
        {destination && (
          <div className="bg-dark-bg rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {destination.name || 'Destination'}
              </p>
              <p className="text-xs text-gray-400">
                {destination.lat.toFixed(4)}, {destination.lon.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Share method */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Share via</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShareMethod('sms')}
              className={`
                p-3 rounded-xl flex flex-col items-center gap-2 transition-colors
                ${shareMethod === 'sms'
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-dark-bg border border-dark-border hover:border-gray-600'
                }
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">SMS</span>
            </button>

            {canUseNativeShare && (
              <button
                onClick={() => setShareMethod('native')}
                className={`
                  p-3 rounded-xl flex flex-col items-center gap-2 transition-colors
                  ${shareMethod === 'native'
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-dark-bg border border-dark-border hover:border-gray-600'
                  }
                `}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-xs">Share</span>
              </button>
            )}

            <button
              onClick={() => setShareMethod('copy')}
              className={`
                p-3 rounded-xl flex flex-col items-center gap-2 transition-colors
                ${shareMethod === 'copy'
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-dark-bg border border-dark-border hover:border-gray-600'
                }
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-xs">Copy</span>
            </button>
          </div>
        </div>

        {/* Contact details for SMS */}
        {shareMethod === 'sms' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Contact name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Mom, Partner"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone number</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        )}

        {/* Auto check-in option */}
        <label className="flex items-center gap-3 p-3 bg-dark-bg rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={autoCheckIn}
            onChange={(e) => setAutoCheckIn(e.target.checked)}
            className="w-5 h-5 rounded border-dark-border bg-dark-surface text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium">Auto check-in</p>
            <p className="text-sm text-gray-400">
              Notify contact when you arrive
            </p>
          </div>
        </label>

        {/* Currently sharing indicator */}
        {sharedWith && (
          <div className="flex items-center gap-2 text-success text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Trip shared with {sharedWith.name}</span>
          </div>
        )}
      </div>

      {/* Share button */}
      <div className="p-4 border-t border-dark-border">
        <button
          onClick={handleShare}
          disabled={shareMethod === 'sms' && !contactPhone}
          className="w-full py-3 bg-primary hover:bg-primary-dark rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Share Trip
        </button>
      </div>
    </div>
  );
}

// SOS Button component
export function SOSButton({ emergencyNumber = '911' }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSOS = () => {
    if (isConfirming) {
      window.location.href = `tel:${emergencyNumber}`;
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 3000);
    }
  };

  return (
    <button
      onClick={handleSOS}
      className={`
        px-4 py-2 rounded-xl font-bold transition-all
        ${isConfirming
          ? 'bg-danger text-white animate-pulse'
          : 'bg-danger/20 text-danger hover:bg-danger/30'
        }
      `}
    >
      {isConfirming ? 'Tap again to call' : 'SOS'}
    </button>
  );
}
