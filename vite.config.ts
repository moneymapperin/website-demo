import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
  },
  esbuild: command === 'build'
    ? {
        pure: ['console.log', 'console.debug', 'console.info'],
        drop: ['debugger'],
        legalComments: 'none',
      }
    : undefined,
}));

