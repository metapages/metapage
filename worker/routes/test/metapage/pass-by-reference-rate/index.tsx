import { Head } from "fresh/runtime";

import { define } from "../../../../utils.ts";

// Only `latest` has passByReference. A published version can still be run at
// /test/metapage/pass-by-reference-rate/<version>: both modes then serialize.
export default define.page(function PassByReferenceRateIndex() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: pass-by-reference-rate</title>
      </Head>
      <main>
        <h2>Metapage test: pass-by-reference-rate</h2>
        <p>
          Speed test: messages per second between two metaframes with{" "}
          <code>passByReference</code> off (the default) and on.
        </p>
        <br />
        <a href="./pass-by-reference-rate/latest">latest</a>
        <br />
        <a href="./pass-by-reference-rate/latest?size=16384">
          latest (16 KiB binary messages)
        </a>
      </main>
    </>
  );
});
