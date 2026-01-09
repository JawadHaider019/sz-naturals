import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: "./",
  server: { 
    port: 5174,
    host: true // Allows access from network
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-toastify', 'react-icons'],
          'utils-vendor': ['axios', 'react-helmet-async']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit
  }
})