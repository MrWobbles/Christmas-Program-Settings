import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    open: 'room1.html'
  },
  optimizeDeps: {
    // Limit dependency scan to our app pages so Vite does not crawl the entire user profile for *.html
    entries: [
      resolve(__dirname, 'room1.html'),
      resolve(__dirname, 'room2.html'),
      resolve(__dirname, 'room3.html'),
      resolve(__dirname, 'room4.html'),
      resolve(__dirname, 'control.html'),
      resolve(__dirname, 'index.html')
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        room1: resolve(__dirname, 'room1.html'),
        room2: resolve(__dirname, 'room2.html'),
        room3: resolve(__dirname, 'room3.html'),
        room4: resolve(__dirname, 'room4.html')
      }
    }
  }
});
