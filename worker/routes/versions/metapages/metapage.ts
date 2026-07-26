import { getAllMetapageVersions } from "../../../util/version-tools.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET() {
    const versions = await getAllMetapageVersions();
    return new Response(JSON.stringify(versions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
