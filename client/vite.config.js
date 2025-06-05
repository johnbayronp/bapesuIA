import { defineConfig } from 'vite';
import ViteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [ViteReact()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },    
  },
});