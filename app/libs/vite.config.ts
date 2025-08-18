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
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    sourcemap: true,
    emptyOutDir: true,
    minify: "esbuild",
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: (chunk) => {
          return `[name].js`;
        },
        minifyInternalExports: true,
        generatedCode: {
          preset: "es2015",
          constBindings: true,
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
