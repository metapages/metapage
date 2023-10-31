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
    // target: "modules",
    target: "esnext",
    
    sourcemap: true,
    // minify: "esbuild",
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
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
