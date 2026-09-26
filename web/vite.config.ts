import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5108,
    proxy: {
      '/api': {
        target: 'http://localhost:5107',
        changeOrigin: true,
        // 没有它，开发时 WS 升级请求会停在 vite 上，连不到后端（见 rules 的 WebSocket 一节）
        ws: true,
      },
    },
  },
})
