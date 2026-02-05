import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.geowake.alarm',
  appName: 'GeoWake',
  webDir: 'dist',
  android: {
    useLegacyBridge: true,
  },
};

export default config;
