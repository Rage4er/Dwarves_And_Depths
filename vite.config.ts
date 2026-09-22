import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dwarves_and_depths/',
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
