import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production builds load the bundled web app from `webDir` (local `dist/`).
 * Optional live-reload for local native debugging only:
 *   CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:8080 npx cap run android
 */
const liveReloadUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'app.lovable.00b0903785004a1d9ae4a0793977a139',
  appName: 'USportz',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    ...(liveReloadUrl
      ? {
          url: liveReloadUrl,
          cleartext: liveReloadUrl.startsWith('http://'),
        }
      : {}),
  },
};

export default config;
