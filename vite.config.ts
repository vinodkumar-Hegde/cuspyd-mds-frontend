import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {alias: {'@': path.resolve(__dirname, '.')}},
    server: {
      proxy: {'/api': {target:env.API_PROXY_TARGET || 'http://127.0.0.1:8001', changeOrigin:true}},
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) return 'charts';
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion';
          },
        },
      },
    },
  };
});
