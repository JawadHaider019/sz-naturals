// vite.config.js
import { defineConfig } from "file:///D:/Projects/sz-naturals/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Projects/sz-naturals/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import viteImagemin from "file:///D:/Projects/sz-naturals/frontend/node_modules/vite-plugin-imagemin/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: {
        quality: 75,
        // Balanced for both
        progressive: true
      },
      pngquant: {
        quality: [0.65, 0.8]
        // Balanced
      },
      webp: {
        quality: 75,
        // Balanced
        lossless: false
      },
      svgo: {
        plugins: [
          { name: "removeViewBox" },
          { name: "removeEmptyAttrs", active: false }
        ]
      }
    })
  ],
  base: "./",
  server: { port: 5174 },
  build: {
    target: "es2015",
    // Good for both
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["react-toastify", "react-icons"],
          "utils-vendor": ["axios", "react-helmet-async"]
        }
      }
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxzei1uYXR1cmFsc1xcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUHJvamVjdHNcXFxcc3otbmF0dXJhbHNcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1Byb2plY3RzL3N6LW5hdHVyYWxzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB2aXRlSW1hZ2VtaW4gZnJvbSAndml0ZS1wbHVnaW4taW1hZ2VtaW4nXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHZpdGVJbWFnZW1pbih7XG4gICAgICBnaWZzaWNsZTogeyBvcHRpbWl6YXRpb25MZXZlbDogMyB9LFxuICAgICAgbW96anBlZzogeyBcbiAgICAgICAgcXVhbGl0eTogNzUsICAvLyBCYWxhbmNlZCBmb3IgYm90aFxuICAgICAgICBwcm9ncmVzc2l2ZTogdHJ1ZSBcbiAgICAgIH0sXG4gICAgICBwbmdxdWFudDogeyBcbiAgICAgICAgcXVhbGl0eTogWzAuNjUsIDAuOF0gIC8vIEJhbGFuY2VkXG4gICAgICB9LFxuICAgICAgd2VicDogeyBcbiAgICAgICAgcXVhbGl0eTogNzUsICAvLyBCYWxhbmNlZFxuICAgICAgICBsb3NzbGVzczogZmFsc2UgXG4gICAgICB9LFxuICAgICAgc3Znbzoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgeyBuYW1lOiAncmVtb3ZlVmlld0JveCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICdyZW1vdmVFbXB0eUF0dHJzJywgYWN0aXZlOiBmYWxzZSB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9KVxuICBdLFxuICBiYXNlOiBcIi4vXCIsXG4gIHNlcnZlcjogeyBwb3J0OiA1MTc0IH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDE1JywgIC8vIEdvb2QgZm9yIGJvdGhcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogWydyZWFjdC10b2FzdGlmeScsICdyZWFjdC1pY29ucyddLFxuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ2F4aW9zJywgJ3JlYWN0LWhlbG1ldC1hc3luYyddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgfVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQTBSLFNBQVMsb0JBQW9CO0FBQ3ZULE9BQU8sV0FBVztBQUNsQixPQUFPLGtCQUFrQjtBQUV6QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixhQUFhO0FBQUEsTUFDWCxVQUFVLEVBQUUsbUJBQW1CLEVBQUU7QUFBQSxNQUNqQyxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUE7QUFBQSxRQUNULGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQSxVQUFVO0FBQUEsUUFDUixTQUFTLENBQUMsTUFBTSxHQUFHO0FBQUE7QUFBQSxNQUNyQjtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osU0FBUztBQUFBO0FBQUEsUUFDVCxVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osU0FBUztBQUFBLFVBQ1AsRUFBRSxNQUFNLGdCQUFnQjtBQUFBLFVBQ3hCLEVBQUUsTUFBTSxvQkFBb0IsUUFBUSxNQUFNO0FBQUEsUUFDNUM7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTTtBQUFBLEVBQ04sUUFBUSxFQUFFLE1BQU0sS0FBSztBQUFBLEVBQ3JCLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGFBQWEsQ0FBQyxrQkFBa0IsYUFBYTtBQUFBLFVBQzdDLGdCQUFnQixDQUFDLFNBQVMsb0JBQW9CO0FBQUEsUUFDaEQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
