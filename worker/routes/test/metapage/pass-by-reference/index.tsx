import { Head } from "fresh/runtime";

import { define } from "../../../../utils.ts";

// Only `latest` has passByReference. A published version can still be run at
// /test/metapage/pass-by-reference/<version>: both modes then serialize.
export default define.page(function PassByReferenceIndex() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: pass-by-reference</title>
      </Head>
      <main>
        <h2>Metapage test: pass-by-reference</h2>
        <p>
          Speed test: stream binary frames between two metaframes serialized as
          base64 data urls (the default) versus passed as-is by postMessage
          (<code>new Metapage({"{ passByReference: true }"})</code>).
        </p>
        <br />
        <a href="./pass-by-reference/latest">latest</a>
        <br />
        <a href="./pass-by-reference/latest?type=Blob">latest (Blob frames)</a>
        <br />
        <a href="./pass-by-reference/latest?type=ArrayBuffer">
          latest (ArrayBuffer frames)
        </a>
      </main>
    </>
  );
});
