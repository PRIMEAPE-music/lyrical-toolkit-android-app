import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lyricaltoolkit.app',
  appName: 'Lyrical Toolkit',
  webDir: 'build',
  server: {
    // Allow cleartext traffic for local development
    // Using 'http' scheme to match the backend API protocol
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    // Configure plugins here as needed
  }
};

export default config;
