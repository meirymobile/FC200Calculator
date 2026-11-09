import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.casio.fc200v.calculator',
  appName: 'Casio FC-200V Calculator',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

