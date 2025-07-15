import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // ESTA ES LA LÍNEA CLAVE PARA CORREGIR EL WARNING "import.meta"
    // Asegura que el compilador de JavaScript (esbuild) apunte a una versión moderna.
    target: 'esnext',
  },
  // No necesitas 'define' para las variables de entorno que empiezan con VITE_
  // Vite las expone automáticamente a través de import.meta.env
});
