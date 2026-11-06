import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // '' prefix = also load non-VITE_ vars. These stay in Node; they never reach the bundle.
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.API_PROXY_TARGET || 'http://localhost:8000';
  const stripApiPrefix = (env.API_PROXY_STRIP_PREFIX ?? 'true') === 'true';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // Pre-bundle every runtime dep at startup. Otherwise Vite discovers them lazily,
    // re-optimizes mid-session, and the browser can end up with two React copies
    // ("Cannot read properties of null (reading 'useId')").
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'msw',
        'msw/browser',
      ],
    },
    server: {
      port: 5173,
      // Browser calls http://localhost:5173/api/... (same origin: no CORS, and the
      // httpOnly refresh cookie just works). Vite forwards it to the backend.
      // FastAPI routes are /auth/..., so when talking to uvicorn directly we strip /api,
      // exactly like Nginx will do later.
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: stripApiPrefix ? (path) => path.replace(/^\/api/, '') : undefined,
        },
      },
    },
  };
});
