import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn: (warning, warn) => warning.code !== 'EVAL' && warn(warning),
    },
  },
});
