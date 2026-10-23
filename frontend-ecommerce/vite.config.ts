import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/auth': {
          target: env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // El login usa el mismo origen de Vite; Keycloak recibe una petición del proxy.
              if (req.headers.origin === `http://${req.headers.host}` && req.url?.endsWith('/protocol/openid-connect/token')) {
                proxyReq.removeHeader('origin');
              }
            });
          }
        }
      }
    }
  }
})
