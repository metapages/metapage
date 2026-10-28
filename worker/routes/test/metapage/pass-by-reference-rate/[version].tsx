import { Head } from "fresh/runtime";

import { define } from "../../../../utils.ts";

const testname = "pass-by-reference-rate";

export default define.page(function PassByReferenceRatePage(props) {
  const { version } = props.params;

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test {testname} @ version: {version}</title>
        <meta
          name="description"
          content="Speed test: messages per second with passByReference off and on"
        />
        <style>
          {`
          #results-table { border-collapse: collapse; margin: 12px 0; }
          #results-table th, #results-table td {
            border: 1px solid #ccc; padding: 4px 10px; text-align: right;
          }
          #pbr-form { display: flex; gap: 12px; align-items: center; margin: 12px 0; }
          #pbr-form input, #pbr-form button { padding: 2px 6px; }
          `}
        </style>
      </Head>
      <main>
        <p>Metapage test {testname} @ version: {version}</p>
        <p>
          Sends many small messages back to back from a producer metaframe to
          a consumer metaframe, with <code>passByReference</code> off (the
          default: binary values become base64 data urls) and on (passed
          as-is by postMessage). Timed from the producer starting until the
          consumer has every message. For throughput by message size see{" "}
          <a href={`../pass-by-reference/${version}`}>pass-by-reference</a>.
        </p>
        <form id="pbr-form" method="get">
          <label>
            messages <input id="count" name="count" type="number" min="1" />
          </label>
          <label>
            binary size (bytes){" "}
            <input id="size" name="size" type="number" min="4" />
          </label>
          <label>
            types <input id="types" name="types" type="text" />
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
