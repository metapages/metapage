import { serveFile } from "@std/http/file-server";
import { normalize } from "@std/path";
import { define } from "../../utils.ts";

/**
 * This is only here to serve the dynamically generated metapage/metaframe library files
 * when developing/testing locally.
 */
export const handler = define.handlers({
  async GET(ctx) {
    const filepath = decodeURIComponent(ctx.url.pathname).replace(
      /^\/lib\//,
      "",
    );
    const fullPath = normalize(`${Deno.cwd()}/../lib/dist/${filepath}`);

    try {
      const response = await serveFile(ctx.req, fullPath);

      // Set appropriate headers based on file type
      if (filepath.endsWith(".js")) {
        response.headers.set("Content-Type", "application/javascript");
      } else if (filepath.endsWith(".css")) {
        response.headers.set("Content-Type", "text/css");
      }

      // Add security headers
      response.headers.set("X-Content-Type-Options", "nosniff");

      return response;
    } catch (error) {
      console.error(`Error serving file: ${error}`);
      return new Response("File not found", { status: 404 });
    }
  },
});
