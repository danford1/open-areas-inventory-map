import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/open-areas-inventory-map/',
  css: {
    preprocessorOptions: {
      less: {
        // Add any Less-specific configuration here
      }
    }
  }
});

