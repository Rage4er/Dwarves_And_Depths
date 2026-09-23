import { defineConfig } from 'vite';
export default defineConfig({
    base: '/dwarves_and_depths/',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 3000,
        open: false,
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    optimizeDeps: {
        include: ['phaser', 'matter-js'],
    },
});
