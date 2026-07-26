import { define } from "../../../../utils.ts";

// Serves the browser-side test driver for the globs test at
// /test/metapage/globs/metapage-test.js. The script lives in static/ (and is
// also reachable directly from there); it is read from disk rather than
// imported, because Vite's `?raw` query does not survive the Deno resolver.
// The path is relative to the working directory, which is the project root
// both locally and on Deno Deploy.
const FILE_PATH = "static/metapage-test-globs.js";

export const handler = define.handlers({
  async GET() {
    try {
      return new Response(await Deno.readTextFile(FILE_PATH), {
        headers: {
          "Content-Type": "application/javascript",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      return new Response("File not found", { status: 404 });
    }
  },
});
