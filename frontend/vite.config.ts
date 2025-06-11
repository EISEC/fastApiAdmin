import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Оптимизация для больших приложений
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Выделяем vendor зависимости в отдельный chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable', 'clsx'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          icons: ['@hugeicons/react', 'lucide-react'],
          store: ['zustand'],
          http: ['axios']
        }
      }
    },
    // Минимизация для продакшена
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Убираем console.log в проде
        drop_debugger: true
      }
    }
  },
  // Настройки для dev сервера
  server: {
    port: 3000,
    host: true
  },
  // Алиасы для упрощения импортов
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
