import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages (the plain production build) serves from /AEC/; Cloudflare and local dev
  // serve from the root.
  base: mode === 'production' ? '/AEC/' : '/',
  // Local dev: the API and uploaded images come from the local Cloudflare server (npm run dev:full).
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8788',
      '/media': 'http://127.0.0.1:8788',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
