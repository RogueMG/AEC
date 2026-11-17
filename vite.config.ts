import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const API = 'http://127.0.0.1:8788'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages (the plain production build) serves from /AEC/; Cloudflare and local dev
  // serve from the root.
  base: mode === 'production' ? '/AEC/' : '/',
  // Local dev: the API and uploaded images come from the local Cloudflare server (npm run dev:full).
  server: {
    proxy: {
      '/api': {
        target: API,
        // The API only accepts changes whose Origin matches the address it was called on (a CSRF
        // guard). Keep the browser's Host header so both say localhost:5173, as they would in production.
        changeOrigin: false,
      },
      '/media': API,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
