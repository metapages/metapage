import { App, staticFiles, trailingSlashes } from "fresh";
import { type State } from "./utils.ts";

// This service is consumed cross-origin: metapages embed the /m and /mf
// renderers in iframes, and the /convert endpoints are a public API called
// from other origins. Applied before staticFiles() so asset responses carry
// the headers too and OPTIONS preflights are answered for every path.
const CORS_HEADERS = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
});

export const app = new App<State>()
  .use(async (ctx) => {
    const origin = ctx.req.headers.get("Origin") || "*";

    if (ctx.req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS(origin),
          "Access-Control-Max-Age": "86400", // 24 hours
        },
      });
    }

    const res = await ctx.next();
    for (const [key, value] of Object.entries(CORS_HEADERS(origin))) {
      res.headers.set(key, value);
    }
    return res;
  })
  .use(staticFiles())
  // Match Fresh 1.x behaviour: strip trailing slashes. The test and convert
  // index pages build their links relatively ("./<name>/<version>"), which
  // only resolve correctly when the current path has no trailing slash.
  .use(trailingSlashes("never"))
  .fsRoutes();
