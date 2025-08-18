import { defineConfig } from 'vitest/config';
import path from 'path';


// Vitest configuration for the MVP project
export default defineConfig({ 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom'
  }
});