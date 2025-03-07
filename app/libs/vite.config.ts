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
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
    },
    sourcemap: true,
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      external: [
        '@metapages/hash-query',
        'base64-arraybuffer',
        'compare-versions',
        'eventemitter3',
        'fast-json-stable-stringify',
        'fetch-retry',
        'mutative',
        'object-hash',
        'picomatch-browser',
      ],
    },







    // target: "modules",
    // emptyOutDir: true,
    // sourcemap: true,
    // minify: "esbuild",
    reportCompressedSize: true,
    // lib: {
    //   entry: path.resolve(__dirname, "src/index.ts"),
    //   formats: ['es', 'cjs'],
    //   fileName: format => `index.${format === 'cjs' ? 'cjs' : 'js'}`
    // },
    // rollupOptions: {
    //   output: {
    //     entryFileNames: '[name].js',
    //     chunkFileNames: '[name].js',
    //     // Make sure to keep separate files for imports
    //     // entryFileNames: '[name].js',
    //     // chunkFileNames: '[name]-[hash].js',
    //     // assetFileNames: '[name]-[hash][extname]',
    //   },
    //   external: [],
    //   plugins: [
    //     typescriptPaths({
    //       preserveExtensions: true,
    //     }),
    //     typescript({
    //       sourceMap: true,
    //       declaration: true,
    //       outDir: "dist",
    //     }),
    //   ],
    // },
  },
}));
