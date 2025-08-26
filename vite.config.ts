import { defineConfig } from 'vite';

export default defineConfig({
  base: '/zen/',
  build: {
    rollupOptions: {
      onwarn: (warning, warn) => warning.code !== 'EVAL' && warn(warning),
    },
  },
});
