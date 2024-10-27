import tailwind from '$fresh/plugins/tailwind.ts';
import { defineConfig } from '$fresh/server.ts';

const certPath = ".certs/local-cert.pem";
const keyPath = ".certs/local-key.pem";
let cert: string | undefined;
let key: string | undefined;
// Check if the file exists in the current directory.
try {
  cert = Deno.statSync(certPath).isFile  ? Deno.readTextFileSync(certPath) : undefined;
  key = Deno.statSync(keyPath).isFile ? Deno.readTextFileSync(keyPath) : undefined;
} catch (err) {} // ignore

export default defineConfig({
  plugins: [tailwind()],
  server: {
    cert,
    key,
    port: parseInt(Deno.env.get("APP_PORT") || Deno.env.get("PORT") || "8000"),
    hostname: "0.0.0.0", //Deno.env.get("APP_FQDN") || 
  },
});
