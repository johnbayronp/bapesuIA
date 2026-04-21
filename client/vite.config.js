import { defineConfig } from 'vite';
import ViteReact from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [ViteReact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },    
  },
});