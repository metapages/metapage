import fs from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

// type DeployTargetType = "glitch" | "lib";
// // values acted on: [glitch | lib]
// const DEPLOY_TARGET = process.env.DEPLOY_TARGET as DeployTargetType | undefined;
// const HOST: string = process.env.HOST || "metaframe1.localhost";
// const PORT: string = process.env.PORT || "4440";
// const CERT_FILE: string | undefined = process.env.CERT_FILE;
// const CERT_KEY_FILE: string | undefined = process.env.CERT_KEY_FILE;
// const BASE: string | undefined = process.env.BASE;
// const OUTDIR: string | undefined = process.env.OUTDIR;
// const INSIDE_CONTAINER: boolean = fs.existsSync("/.dockerenv");

// // Get the github pages path e.g. if served from https://<name>.github.io/<repo>/
// // then we need to pull out "<repo>"
// const packageJson: { name: string; version: string } = JSON.parse(
//   fs.readFileSync("./package.json", { encoding: "utf8", flag: "r" })
// );

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  // For serving NOT at the base path e.g. with github pages: https://<user_or_org>.github.io/<repo>/
//   base: BASE,
  resolve: {
    alias: {
      "/@": resolve(__dirname, "./src"),
    },
  },
  plugins: [],
  build: {
    // outDir: DEPLOY_TARGET === "lib" ? "dist" : OUTDIR,
    target: "esnext",
    sourcemap: true,
    minify: mode === "development" ? false : "esbuild",
    // emptyOutDir: DEPLOY_TARGET === "glitch" || DEPLOY_TARGET === "lib",
    lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'Metapage',
        // fileName: (format) => `metapage.${format}.js`,
      },

    // lib:
    //   DEPLOY_TARGET === "lib"
    //     ? {
    //         entry: resolve(__dirname, "src/lib/index.ts"),
    //         name: packageJson.name,
    //         // the proper extensions will be added
    //         fileName: "index",
    //       }
    //     : undefined,
  },
  esbuild: {
    // https://github.com/vitejs/vite/issues/8644
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
//   server: {
//     ...(DEPLOY_TARGET === "glitch"
//       ? {
//           strictPort: true,
//           hmr: {
//             port: 443, // Run the websocket server on the SSL port
//           },
//         }
//       : {
//           open: false,
//           host: INSIDE_CONTAINER ? "0.0.0.0" : HOST,
//           port: parseInt(
//             CERT_KEY_FILE && fs.existsSync(CERT_KEY_FILE) ? PORT : "8000"
//           ),
//           https:
//             CERT_KEY_FILE &&
//             fs.existsSync(CERT_KEY_FILE) &&
//             CERT_FILE &&
//             fs.existsSync(CERT_FILE)
//               ? {
//                   key: fs.readFileSync(CERT_KEY_FILE),
//                   cert: fs.readFileSync(CERT_FILE),
//                 }
//               : undefined,
//         }),

//   },
}));
