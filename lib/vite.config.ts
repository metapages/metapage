import path, { resolve } from "path";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import { defineConfig, type Plugin } from "vite";

import typescript from "@rollup/plugin-typescript";

// Plugin to ensure build process exits properly in CI
// This prevents hanging when plugins leave open handles
function forceExitPlugin(): Plugin {
  return {
    name: "force-exit",
    closeBundle() {
      // Force exit after bundle is closed (files written) in CI to prevent hanging
      // IMPORTANT: Use closeBundle, not buildEnd - buildEnd fires BEFORE files are written!
      if (process.env.CI) {
        setTimeout(() => process.exit(0), 100);
      }
    },
  };
}

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
    // Only add force-exit plugin in CI to prevent hanging
    ...(process.env.CI ? [forceExitPlugin()] : []),
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
        // Remove preserveModules to create a single bundled file
        // preserveModules: true,
        // preserveModulesRoot: "src",
        entryFileNames: () => "index.js",
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
