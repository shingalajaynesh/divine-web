import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // compress assets larger than 1KB
      deleteOriginFile: false
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  optimizeDeps: {
    include: ['antd', '@ant-design/icons', '@ant-design/cssinjs', 'dayjs', 'lodash', 'firebase/app', 'firebase/auth'],
  },
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning limit since we are fine-tuning chunking
    cssCodeSplit: true, // Split CSS per page
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('@ant-design/icons')) {
              return 'antd-icons';
            }
            if (
              id.includes('antd') ||
              id.includes('@ant-design/cssinjs') ||
              id.includes('rc-')
            ) {
              return 'antd-core';
            }
            if (id.includes('lodash') || id.includes('dayjs')) {
              return 'vendor-helpers';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
