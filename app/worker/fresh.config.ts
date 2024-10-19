import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

const certPath = ".certs/local-cert.pem";
const keyPath = ".certs/local-key.pem";
const cert = Deno.statSync(certPath).isFile  ? Deno.readTextFileSync(certPath) : undefined;
const key = Deno.statSync(keyPath).isFile ? Deno.readTextFileSync(keyPath) : undefined;

export default defineConfig({
  plugins: [tailwind()],
  server: {
    cert,
    key,
    port: parseInt(Deno.env.get("APP_PORT") || "8000"),
    hostname: "0.0.0.0",
  },
});
