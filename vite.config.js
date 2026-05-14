import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://trade-vault-back-end-new-v1.vercel.app/',
        changeOrigin: true,
      },
      '/ws': {
        target: 'wss://trade-vault-back-end-new-v1.vercel.app/',
        ws: true,
      }
    }
  }
})
