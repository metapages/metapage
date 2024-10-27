import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';

export const handler: Handlers = {
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

export default function MetaframeConversionPage(props: PageProps) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metaframe definition conversion</title>
      </Head>
      <main>
        <h2>Metaframe definition conversion</h2>
        <br />
        <div>todo</div>
      </main>
    </>
  );
}