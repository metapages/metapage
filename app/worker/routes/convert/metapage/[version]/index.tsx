import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import { type Handlers } from "$fresh/server.ts";

interface MetapageVersionProps {
  version: string;
}

export const handler: Handlers<MetapageVersionProps> = {
  async GET(_req, ctx) {
    return ctx.render(ctx.data);
  },

  async POST(_req, ctx) {
    const headers = _req.headers;
    return new Response(JSON.stringify({ message: "todo" }), {
      headers: { "Content-Type": "application/json" },
    })
  },
};

export default function MetapageConversionPage(props: PageProps) {
  let { version } = props.params;
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage definition conversion for v{version}</title>
        {/* <script type="module" src={metapageScriptSrc}></script> */}
      </Head>
      <main>
        <h1>Metapage definition conversion for v{version}</h1>
        <br />
        <div>todo</div>
      </main>
    </>
  );
}