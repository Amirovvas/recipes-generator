import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Запросы /api/* уходят на Express — без CORS и без адреса бэкенда в коде
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
