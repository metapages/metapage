import path, { resolve } from 'path';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { defineConfig } from 'vite';

import typescript from '@rollup/plugin-typescript';

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "/@": resolve(__dirname, "./src"),
    },
  },

  plugins: [],

  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },

  build: {
    outDir: "./dist",
    target: "modules",
    emptyOutDir: true,
    sourcemap: true,
    minify: "esbuild",
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: (format) => `index.${format === 'es' ? 'js' : format}`,
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        // Make sure to keep separate files for imports
        // entryFileNames: '[name].js',
        // chunkFileNames: '[name]-[hash].js',
        // assetFileNames: '[name]-[hash][extname]',
      },
      external: [],
      plugins: [
        typescriptPaths({
          preserveExtensions: true,
        }),
        typescript({
          sourceMap: true,
          declaration: true,
          outDir: "dist",
        }),
      ],
    },
  },
}));
