import { Head } from "fresh/runtime";

import { define } from "../../../../utils.ts";

const testname = "pass-by-reference";

export default define.page(function PassByReferencePage(props) {
  const { version } = props.params;

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test {testname} @ version: {version}</title>
        <meta
          name="description"
          content="Speed test: binary values serialized to data urls vs passed by reference"
        />
        <style>
          {`
          #results-table { border-collapse: collapse; margin: 12px 0; }
          #results-table th, #results-table td {
            border: 1px solid #ccc; padding: 4px 10px; text-align: right;
          }
          #pbr-form { display: flex; gap: 12px; align-items: center; margin: 12px 0; }
          #pbr-form input, #pbr-form select, #pbr-form button { padding: 2px 6px; }
          `}
        </style>
      </Head>
      <main>
        <p>Metapage test {testname} @ version: {version}</p>
        <p>
          Streams frames from a producer metaframe to a consumer metaframe,
          serialized as base64 data urls (the default), then passed as-is by
          postMessage (<code>passByReference: true</code>). Timed from the
          producer starting until the consumer has every frame.
        </p>
        <form id="pbr-form" method="get">
          <label>
            frames <input id="count" name="count" type="number" min="1" />
          </label>
          <label>
            sizes (KiB) <input id="sizes" name="sizes" type="text" />
          </label>
          <label>
            type{" "}
            <select id="type" name="type">
              <option>Uint8Array</option>
              <option>ArrayBuffer</option>
              <option>Blob</option>
            </select>
          </label>
          <button type="submit">run</button>
        </form>
        <div id="status">status</div>
        <div id="results"></div>
        <div id="frames"></div>
        <script type="module" src={`/metapage-test-${testname}.js`}></script>
      </main>
    </>
  );
});
