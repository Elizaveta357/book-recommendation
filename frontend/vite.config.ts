/**
 * Настройки Vite — сборщика и dev-сервера фронта.
 *
 * Фронт и бэкенд живут в разных контейнерах. Запросы фронта на /api dev-сервер
 * пересылает бэкенду, поэтому в коде фронта адрес бэкенда не пишется нигде.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // AI: e2e-тест ходит на фронт по имени контейнера «frontend». Vite по умолчанию
    // отвечает только на localhost и такие запросы блокирует — разрешаем явно.
    allowedHosts: ['frontend'],
    // AI: на Windows изменения файлов из папки проекта не доходят до контейнера
    // событиями — без опроса горячая перезагрузка молчит.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
