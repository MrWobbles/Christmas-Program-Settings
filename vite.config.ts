import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, readdirSync, unlinkSync, rmdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'src/assets',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: 'src/html/spotify.html',
    proxy: {
      '/caldav-proxy': {
        target: 'https://caldav.icloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/caldav-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Forward the authorization header
            proxyReq.setHeader('Host', 'caldav.icloud.com');
          });
        }
      }
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true
  },
  optimizeDeps: {
    // Limit dependency scan to our app pages so Vite does not crawl the entire user profile for *.html
    entries: [
      resolve(__dirname, 'src/html/room1.html'),
      resolve(__dirname, 'src/html/room2.html'),
      resolve(__dirname, 'src/html/room3.html'),
      resolve(__dirname, 'src/html/room4.html'),
      resolve(__dirname, 'src/html/room5.html'),
      resolve(__dirname, 'src/html/control.html'),
      resolve(__dirname, 'src/html/timing.html'),
      resolve(__dirname, 'src/html/index.html'),
      resolve(__dirname, 'src/html/spotify.html')
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        room1: resolve(__dirname, 'src/html/room1.html'),
        room2: resolve(__dirname, 'src/html/room2.html'),
        room3: resolve(__dirname, 'src/html/room3.html'),
        room4: resolve(__dirname, 'src/html/room4.html'),
        room5: resolve(__dirname, 'src/html/room5.html'),
        control: resolve(__dirname, 'src/html/control.html'),
        timing: resolve(__dirname, 'src/html/timing.html'),
        index: resolve(__dirname, 'src/html/index.html'),
        spotify: resolve(__dirname, 'src/html/spotify.html')
      }
    }
  },
  plugins: [
    {
      name: 'flatten-html',
      apply: 'build', // Only run during build, not dev server
      closeBundle() {
        // Move HTML files from dist/src/html to dist root
        const htmlDir = join(__dirname, 'dist', 'src', 'html');
        const distDir = join(__dirname, 'dist');

        try {
          const files = readdirSync(htmlDir);
          files.forEach(file => {
            if (file.endsWith('.html')) {
              const filePath = join(htmlDir, file);
              let content = readFileSync(filePath, 'utf-8');
              // Fix asset paths: change ../assets/ to ./assets/
              content = content.replace(/\.\.\//g, './');
              const destPath = join(distDir, file);
              writeFileSync(destPath, content);
              unlinkSync(filePath);
            }
          });
          // Remove empty src/html directory structure
          rmdirSync(htmlDir);
          rmdirSync(join(__dirname, 'dist', 'src'));
        } catch (err) {
          console.warn('Could not flatten HTML files:', err);
        }
      }
    }
  ]
});
