// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa';

// export default defineConfig({
//   plugins: [
//     react(),
//     VitePWA({
//       registerType: 'autoUpdate',
//       includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
//       manifest: {
//         name: 'SZ Naturals',
//         short_name: 'SZ Naturals',
//         description: 'Herbal hair care products',
//         theme_color: '#ffffff',
//         icons: [
//           {
//             src: 'pwa-192x192.png',
//             sizes: '192x192',
//             type: 'image/png'
//           },
//           {
//             src: 'pwa-512x512.png',
//             sizes: '512x512',
//             type: 'image/png'
//           }
//         ]
//       }
//     })
//   ],
//   server: {
//     port: 3000,
//     open: true
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: false,
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom'],
//           ui: ['react-icons', 'slick-carousel']
//         }
//       }
//     }
//   }
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Remove PWA for now to fix build issues

export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Prevent permission issues
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['react-icons', 'slick-carousel']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});