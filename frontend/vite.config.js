import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접속 허용
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'wo.doorlife.synology.me',
      'api.doorlife.synology.me',
      'localhost',
      '192.168.0.109',
      '127.0.0.1'
    ],
    hmr: false, // HMR 완전 비활성화
    watch: {
      usePolling: true, // 파일 감시 비활성화
    },
    proxy: {
      '/api': {
        target: 'http://192.168.0.109:3200',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://192.168.0.109:3200',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.0.109:3200',
        changeOrigin: true,
        ws: true, // WebSocket 프록시 활성화
      }
    }
  },
  build: {
    minify: false, // 디버깅 용이
  }
})
