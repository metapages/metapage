/**
 * Serves the production build (_fresh/server.js) over HTTPS for the test suite.
 *
 * `deno serve` — what `deno task start` / `deno task preview` use — has no way
 * to supply a TLS certificate (its `--cert` flag loads a certificate authority,
 * not a server certificate), so the tests spawn this instead. The certificates
 * come from `just _mkcert`.
 *
 * Run from the worker directory:
 *   APP_PORT=8762 deno run -A test/src/serve-tls.ts
 */
import server from "../../_fresh/server.js";

const port = parseInt(Deno.env.get("APP_PORT") || "8000", 10);
const cert = await Deno.readTextFile(".certs/local-cert.pem");
const key = await Deno.readTextFile(".certs/local-key.pem");

Deno.serve({ port, hostname: "0.0.0.0", cert, key }, server.fetch);
