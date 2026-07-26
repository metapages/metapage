import { getAllMetapageVersions } from "../../util/version-tools.ts";
import { define } from "../../utils.ts";

const versions = await getAllMetapageVersions();
const latestVersion = versions[0];

const isDevelopment = Deno.env.get("DEVELOPMENT") === "true";

const metapageLibImportUrl = isDevelopment
  ? "/lib/index.js"
  : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" + latestVersion;

// Read from disk rather than inlined with Vite's `?raw`: Vite's HTML plugin
// claims any `.html` import and tries to extract its inline <script>, so `?raw`
// never reaches the file. The path is relative to the working directory, which
// is the project root both locally and on Deno Deploy.
const htmlTemplate = await Deno.readTextFile("static/render-metapage.html");

const html = htmlTemplate.replace("{{VERSION}}", metapageLibImportUrl);

export const handler = define.handlers({
  GET() {
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  },
});
