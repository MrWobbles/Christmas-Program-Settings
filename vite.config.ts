import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    open: 'room1.html'
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
