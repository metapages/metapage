
import { FreshContext } from "$fresh/server.ts";
import { serveFile } from "https://deno.land/std@0.181.0/http/file_server.ts";
import { normalize } from "jsr:@std/path";

/**
 * This is only here to serve the dynamically generated metapage/metaframe library files
 * when developing/testing locally.
 */
export const handler = async (_req: Request, _ctx: FreshContext): Promise<Response> => {
  const url = new URL(_req.url);
    const filepath = decodeURIComponent(url.pathname).replace(/^\/lib\/metapage/, "");
    const fullPath = normalize(`${Deno.cwd()}/../libs/dist/${filepath}`);

    try {
      const response = await serveFile(_req, fullPath);
      
      // Set appropriate headers based on file type
      if (filepath.endsWith('.js')) {
        response.headers.set("Content-Type", "application/javascript");
      } else if (filepath.endsWith('.css')) {
        response.headers.set("Content-Type", "text/css");
      }
      
      // Add security headers
      response.headers.set("X-Content-Type-Options", "nosniff");

      return response;
    } catch (error) {
      console.error(`Error serving file: ${error}`);
      return new Response("File not found", { status: 404 });
    }
};
