import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige de forma segura las llamadas de Mercado Pago para evitar el CORS
      '/api-mercadopago': {
        target: 'https://api.mercadopago.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-mercadopago/, ''),
      }
    }
  }
})