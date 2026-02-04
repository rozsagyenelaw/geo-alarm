import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatCacheSize } from '../hooks/useOfflineMode';

const RADIUS_OPTIONS = [
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', description: 'Simple tap to dismiss' },
  { value: 'medium', label: 'Medium', description: 'Solve a math problem' },
  { value: 'hard', label: 'Hard', description: 'Type a phrase' },
  { value: 'shake', label: 'Shake', description: 'Shake your phone' }
];

const SOUND_OPTIONS = [
  { value: 'soft', label: 'Soft', description: 'Gentle wake up' },
  { value: 'loud', label: 'Loud', description: 'Make sure you wake up' },
  { value: 'gentle', label: 'Gentle', description: 'Musical tones' }
];

export default function SettingsPanel({ onClose, cacheSize = 0, onClearCache }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const SettingSection = ({ title, children }) => (
    <div className="py-4 border-b border-dark-border last:border-b-0">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );

  const ToggleSetting = ({ label, description, value, onChange }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <div className={`
        w-12 h-7 rounded-full transition-colors relative
        ${value ? 'bg-primary' : 'bg-dark-border'}
      `}>
        <div className={`
          absolute top-1 w-5 h-5 rounded-full bg-white transition-transform
          ${value ? 'translate-x-6' : 'translate-x-1'}
        `} />
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </div>
    </label>
  );

  const SelectSetting = ({ label, value, options, onChange }) => (
    <div className="py-2">
      <p className="font-medium mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-3 rounded-xl text-left transition-colors
              ${value === option.value
                ? 'bg-primary/20 border border-primary'
                : 'bg-dark-bg border border-dark-border hover:border-gray-600'
              }
            `}
          >
            <p className="font-medium">{option.label}</p>
            {option.description && (
              <p className="text-xs text-gray-400">{option.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg border-b border-dark-border p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 pb-20">
        {/* Alarm Settings */}
        <SettingSection title="Alarm">
          <SelectSetting
            label="Default radius"
            value={settings.defaultRadius}
            options={RADIUS_OPTIONS}
            onChange={(v) => updateSettings({ defaultRadius: v })}
          />

          <SelectSetting
            label="Dismiss difficulty"
            value={settings.dismissDifficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={(v) => updateSettings({ dismissDifficulty: v })}
          />

          <SelectSetting
            label="Alarm sound"
            value={settings.soundType}
            options={SOUND_OPTIONS}
            onChange={(v) => updateSettings({ soundType: v })}
          />

          <ToggleSetting
            label="Enable sound"
            value={settings.enableSound}
            onChange={(v) => updateSettings({ enableSound: v })}
          />

          <ToggleSetting
            label="Enable vibration"
            value={settings.enableVibration}
            onChange={(v) => updateSettings({ enableVibration: v })}
          />

          <ToggleSetting
            label="Escalating alarm"
            description="Gradually increase volume"
            value={settings.enableEscalation}
            onChange={(v) => updateSettings({ enableEscalation: v })}
          />
        </SettingSection>

        {/* Safety Settings */}
        <SettingSection title="Safety">
          <div className="py-2">
            <p className="font-medium mb-2">Emergency contact</p>
            <input
              type="tel"
              value={settings.emergencyContact?.phone || ''}
              onChange={(e) => updateSettings({
                emergencyContact: { ...settings.emergencyContact, phone: e.target.value }
              })}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Phone number"
            />
          </div>

          <div className="py-2">
            <p className="font-medium mb-2">Missed stop threshold</p>
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map(value => (
                <button
                  key={value}
                  onClick={() => updateSettings({ missedStopThreshold: value })}
                  className={`
                    p-3 rounded-xl text-center transition-colors
                    ${settings.missedStopThreshold === value
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-dark-bg border border-dark-border'
                    }
                  `}
                >
                  {value >= 1000 ? `${value / 1000}km` : `${value}m`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Alert if you travel this far past your destination
            </p>
          </div>

          <ToggleSetting
            label="Auto check-in"
            description="Notify contacts when you arrive"
            value={settings.autoCheckIn}
            onChange={(v) => updateSettings({ autoCheckIn: v })}
          />
        </SettingSection>

        {/* Battery Settings */}
        <SettingSection title="Battery">
          <ToggleSetting
            label="Low power mode"
            description="Less frequent location updates"
            value={settings.lowPowerMode}
            onChange={(v) => updateSettings({ lowPowerMode: v })}
          />
        </SettingSection>

        {/* Display Settings */}
        <SettingSection title="Display">
          <ToggleSetting
            label="Show ETA"
            description="Display estimated arrival time"
            value={settings.showETA}
            onChange={(v) => updateSettings({ showETA: v })}
          />

          <ToggleSetting
            label="Show speed"
            description="Display current speed"
            value={settings.showSpeed}
            onChange={(v) => updateSettings({ showSpeed: v })}
          />

          <ToggleSetting
            label="Persistent notification"
            description="Show distance in notification bar"
            value={settings.persistentNotification}
            onChange={(v) => updateSettings({ persistentNotification: v })}
          />
        </SettingSection>

        {/* Storage */}
        <SettingSection title="Storage">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Offline map cache</p>
              <p className="text-sm text-gray-400">{formatCacheSize(cacheSize)}</p>
            </div>
            <button
              onClick={onClearCache}
              className="px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm hover:border-danger hover:text-danger transition-colors"
            >
              Clear
            </button>
          </div>
        </SettingSection>

        {/* Reset */}
        <SettingSection title="Data">
          <button
            onClick={() => {
              updateSettings({ onboardingComplete: false });
              window.location.reload();
            }}
            className="w-full py-3 bg-dark-surface border border-dark-border rounded-xl font-medium hover:border-primary transition-colors mb-3"
          >
            Restart Setup Wizard
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 bg-danger/20 text-danger rounded-xl font-medium hover:bg-danger/30 transition-colors"
          >
            Reset All Settings
          </button>
        </SettingSection>

        {/* App Info */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>GeoWake v1.0.0</p>
          <p className="mt-1">Location-based alarm for commuters</p>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Reset Settings?</h3>
            <p className="text-gray-400 mb-6">
              This will restore all settings to their default values. Saved locations will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-dark-bg rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetSettings();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 bg-danger rounded-xl font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
