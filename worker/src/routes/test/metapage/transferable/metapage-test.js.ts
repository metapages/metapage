import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req) {
    // Extract the path from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const testType = pathSegments[pathSegments.length - 2];
    const filePath = `src/static/metapage-test-${testType}.js`;
    try {
      const fileContent = await Deno.readTextFile(filePath);
      const resp = new Response(fileContent, {
        headers: {
          "Content-Type": "application/javascript",
          "X-Content-Type-Options": "nosniff",
        },
      });

      return resp;
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      return new Response("File not found", { status: 404 });
    }
  },
};
