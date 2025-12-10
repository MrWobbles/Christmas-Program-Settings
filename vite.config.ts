import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, readdirSync, unlinkSync, rmdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    open: 'html/control.html'
  },
  optimizeDeps: {
    // Limit dependency scan to our app pages so Vite does not crawl the entire user profile for *.html
    entries: [
      resolve(__dirname, 'html/room1.html'),
      resolve(__dirname, 'html/room2.html'),
      resolve(__dirname, 'html/room3.html'),
      resolve(__dirname, 'html/room4.html'),
      resolve(__dirname, 'html/control.html'),
      resolve(__dirname, 'html/timing.html'),
      resolve(__dirname, 'html/index.html')
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        room1: resolve(__dirname, 'html/room1.html'),
        room2: resolve(__dirname, 'html/room2.html'),
        room3: resolve(__dirname, 'html/room3.html'),
        room4: resolve(__dirname, 'html/room4.html'),
        control: resolve(__dirname, 'html/control.html'),
        timing: resolve(__dirname, 'html/timing.html'),
        index: resolve(__dirname, 'html/index.html')
      }
    }
  },
  plugins: [
    {
      name: 'flatten-html',
      apply: 'build', // Only run during build, not dev server
      closeBundle() {
        // Move HTML files from dist/html to dist root
        const htmlDir = join(__dirname, 'dist', 'html');
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
          // Remove empty html directory
          rmdirSync(htmlDir);
        } catch (err) {
          console.warn('Could not flatten HTML files:', err);
        }
      }
    }
  ]
});
