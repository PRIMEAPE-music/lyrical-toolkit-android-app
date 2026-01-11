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
    // Enable native HTTP to bypass CORS issues on mobile
    // This patches global fetch() to use native HTTP requests
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
