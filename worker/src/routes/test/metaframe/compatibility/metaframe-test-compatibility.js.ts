import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req) {
    const filePath = "src/static/metaframe-test-compatibility.js";
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
