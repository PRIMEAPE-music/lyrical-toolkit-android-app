import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lyricaltoolkit.app',
  appName: 'Lyrical Toolkit',
  webDir: 'build',
  server: {
    // Use HTTPS for Netlify API connections
    androidScheme: 'https',
    // Allow cleartext for mixed content if needed
    cleartext: false
  },
  plugins: {
    // Configure plugins here as needed
  }
};

export default config;
