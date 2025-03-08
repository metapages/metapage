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

  plugins: [
    typescript({
      sourceMap: true,
      declaration: true,
      outDir: "dist",
    }),
  ],

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
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: (chunk) => {
          return `[name].js`;
        },
      },
      plugins: [
        typescriptPaths({
          preserveExtensions: true,
        }),
      ],
    },
    reportCompressedSize: true,
  },
}));
