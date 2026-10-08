import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: 'env',

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
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/screenshots': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '^/connect(/|$)': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
