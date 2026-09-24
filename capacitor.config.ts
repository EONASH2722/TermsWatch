import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'app.termswatch.mobile',
  appName: 'TermsWatch',
  webDir: 'dist',
  android: { path: 'apps/android', backgroundColor: '#071117' },
  server: { androidScheme: 'https' },
};
export default config;
