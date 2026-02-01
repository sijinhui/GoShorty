import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  server: {
    port: 5173,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:8800',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8800',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 Ant Design 分离到单独的 chunk
          'antd-vendor': ['antd'],
          // 将其他第三方库分离
          'vendor': ['axios', '@tanstack/react-query', 'zustand', 'date-fns']
        }
      }
    },
    // 提高 chunk 大小警告阈值到 1000kb
    // chunkSizeWarningLimit: 1000
  }
})
