import { type Handlers } from '$fresh/server.ts';

import { getAllMetapageVersions } from '../../util/version-tools.ts';

const versions = await getAllMetapageVersions();
const latestVersion = versions[0];

const isDevelopment = Deno.env.get("DEVELOPMENT") === "true";

const getCachedHtmlContent = async () => {
  const htmlContent: string = await Deno.readTextFile(
    "src/static/render-metapage.html"
  );
  const metapageLibImportUrl = isDevelopment
    ? "/lib/index.js"
    : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" + latestVersion;

  return htmlContent.replace("{{VERSION}}", metapageLibImportUrl);
};

const staticHtmlContent = await getCachedHtmlContent();

export const handler: Handlers = {
  async GET(_req, ctx) {
    // Cache for production - will be populated on first read
    if (!isDevelopment) {
      return new Response(staticHtmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    let devHtmlContent: string = await getCachedHtmlContent();
    return new Response(devHtmlContent, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  },
};
