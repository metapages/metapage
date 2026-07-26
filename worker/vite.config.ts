import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

const port = parseInt(
  Deno.env.get("APP_PORT") || Deno.env.get("PORT") || "8000",
  10,
);

// NOTE: the dev server runs over plain HTTP (HTTP/1.1), not HTTPS.
//
// Vite enables HTTP/2 whenever `server.https` is set, and Deno's `node:http2`
// compatibility layer truncates response bodies over ~48KB, which would break
// the metapage library bundles served from /lib. `http://localhost` is still a
// browser "secure context", so the postMessage/clipboard APIs metaframes rely
// on keep working. `just test` is unaffected: it runs against the production
// build via `deno serve --cert/--key`, which serves HTTPS over HTTP/1.1.
export default defineConfig({
  server: { host: "0.0.0.0", port },
  plugins: [fresh()],
});
