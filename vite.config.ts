import path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
        '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 3000,
        proxy: {
        '/api': {
            target: 'http://localhost:8000',  // ← URL de tu backend FastAPI
            changeOrigin: true,
            ws: true,  // ← habilita proxy de WebSocket también
        }
        }
  }
})