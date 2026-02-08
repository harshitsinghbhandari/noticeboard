
import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
    build: {
        target: 'node20', // or whatever your target is
        lib: {
            entry: 'app/server.ts',
            formats: ['es'],
            fileName: 'server',
        },
        rollupOptions: {
            external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`), 'express', 'pg', 'cors'],
        },
        outDir: 'dist',
        minify: false, // Optional: useful for debugging
    },
});
