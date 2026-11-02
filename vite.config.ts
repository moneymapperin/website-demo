import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function deleteDataRewritePlugin(): Plugin {
  const handler = (req: any, res: any, next: () => void) => {
    if (!req.url) return next();
    const urlObj = new URL(req.url, 'http://localhost');
    const pathname = urlObj.pathname;
    if (pathname === '/data-deletion-request.html' || pathname === '/data-deletion-request') {
      res.writeHead(301, { Location: `/delete_my_data${urlObj.search}` });
      res.end();
      return;
    }
    if (pathname === '/delete_my_data' || pathname === '/delete_my_data/') {
      req.url = `/delete_my_data.html${urlObj.search}`;
    }
    next();
  };

  return {
    name: 'delete-my-data-rewrite',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), deleteDataRewritePlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/mfapi': {
        target: 'https://api.mfapi.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mfapi/, ''),
      },
    },
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
