import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/node_modules.partial/**', '**/dist/**', '**/dist-web/**', '**/apps/android/**', '**/release/**'],
    maxWorkers: 1,
    minWorkers: 1,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
