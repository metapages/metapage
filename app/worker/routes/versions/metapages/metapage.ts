import { type Handlers } from "$fresh/server.ts";
import { getAllMetapageVersions } from "../../_util/versions.ts";

export const handler: Handlers = {
  async GET(_req) {
    const versions = await getAllMetapageVersions();
    return new Response(JSON.stringify(versions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};