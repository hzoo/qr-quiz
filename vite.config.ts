import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Custom plugin to serve qr.html at /qr path during development
    {
      name: 'serve-qr-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/qr' || req.url === '/qr/') {
            const qrHtmlPath = path.resolve(__dirname, 'qr.html');
            const content = fs.readFileSync(qrHtmlPath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        qr: path.resolve(__dirname, 'qr.html'),
      },
      output: {
        // Ensure qr.html gets output to the correct location
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Ensure CSS is properly processed
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
  },
}); 