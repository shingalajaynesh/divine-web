import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['antd', '@ant-design/icons', '@ant-design/cssinjs', 'dayjs', 'lodash', 'firebase/app', 'firebase/auth'],
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (
              id.includes('antd') ||
              id.includes('@ant-design') ||
              id.includes('rc-') ||
              id.includes('lodash') ||
              id.includes('dayjs')
            ) {
              return 'antd-ux';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
