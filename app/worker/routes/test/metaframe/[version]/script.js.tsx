import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    // Get query parameters if needed
    // Get the version parameter from the context
    let version = ctx.params.version;
    if (version.startsWith('latest')) {
      // it can be versionLatest in the URL header but the internal ${version} must then be 'latest';
      version = 'latest';
  }

    // Create your JavaScript payload
    const jsPayload = `console.log("version=${version}");`;

    // Create a response with the JavaScript payload
    const response = new Response(jsPayload, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });

    return response;
  },
};