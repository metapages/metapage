import { define } from "../../../../utils.ts";

// Serves the browser-side test driver for the metaframe compatibility test at
// /test/metaframe/compatibility/metaframe-test-compatibility.js. Read from disk
// rather than imported, because Vite's `?raw` query does not survive the Deno
// resolver. The path is relative to the working directory, which is the project
// root both locally and on Deno Deploy.
const FILE_PATH = "static/metaframe-test-compatibility.js";

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
