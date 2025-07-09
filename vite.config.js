import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // 👈 esto resuelve las rutas en producción
  plugins: [react()],
  build: {
    outDir: 'build', // 👈 evita destruir la raíz y respeta tu estructura
  }
})
