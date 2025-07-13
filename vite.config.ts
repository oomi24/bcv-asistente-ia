import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Esto corrige las advertencias de import.meta
  },
  // No es necesario definir manualmente process.env aquí para las variables VITE_
  // Vite las expone automáticamente a través de import.meta.env si comienzan con VITE_
});
