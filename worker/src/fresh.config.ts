import tailwind from "$fresh/plugins/tailwind.ts";
import { defineConfig } from "$fresh/server.ts";

const certPath = ".certs/local-cert.pem";
const keyPath = ".certs/local-key.pem";
let cert: string | undefined;
let key: string | undefined;
// Check if the file exists in the current directory.
try {
  cert = Deno.statSync(certPath).isFile
    ? Deno.readTextFileSync(certPath)
    : undefined;
  key = Deno.statSync(keyPath).isFile
    ? Deno.readTextFileSync(keyPath)
    : undefined;
} catch (err: any) {
  console.warn("Could not load SSL certificates:", err.message);
} // continue without SSL if files not found

// Get environment variables with defaults
const PORT = parseInt(
  Deno.env.get("APP_PORT") || Deno.env.get("PORT") || "8000"
);
const HOSTNAME = Deno.env.get("APP_FQDN") || "0.0.0.0"; // Use 0.0.0.0 to bind to all interfaces

export default defineConfig({
  plugins: [tailwind()],
  server: {
    cert,
    key,
    port: PORT,
    hostname: HOSTNAME,
    // Force HTTPS when certificates are available
    secure: cert !== undefined && key !== undefined,
  },
});
