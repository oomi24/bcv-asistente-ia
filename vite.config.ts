import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  server: { // AÑADE ESTA SECCIÓN
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Puedes cambiar esto a tu URL de Vercel si ya está desplegada
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
