import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: { 
        quality: 75,  // Balanced for both
        progressive: true 
      },
      pngquant: { 
        quality: [0.65, 0.8]  // Balanced
      },
      webp: { 
        quality: 75,  // Balanced
        lossless: false 
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ],
  base: "./",
  server: { port: 5174 },
  build: {
    target: 'es2015',  // Good for both
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
    }
  }
})