import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const warningSource = warning.id || warning.importer || ''

        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          /node_modules[\\/](framer-motion|lucide-react)/.test(warningSource)
        ) {
          return
        }

        warn(warning)
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: false
  }
})
