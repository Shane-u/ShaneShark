import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: process.env.VITE_BASE_URL
    ? process.env.VITE_BASE_URL
    : (process.env.GITHUB_ACTIONS ? '/ShaneShark/' : '/'),
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
})
