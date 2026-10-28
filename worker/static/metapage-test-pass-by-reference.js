// Speed test for passByReference (#208): stream binary frames from a
// producer metaframe to a consumer metaframe, once with base64 data url
// serialization (the default) and once passed as-is by postMessage, and
// compare. Throughput by frame size; for messages / second see
// metapage-test-pass-by-reference-rate.js.
//
// URL: /test/metapage/pass-by-reference/<version>?count=30&sizes=16,256,1024&type=Uint8Array
//   count  frames per trial
//   sizes  frame sizes in KiB, comma separated
//   type   Uint8Array | ArrayBuffer | Blob
//
// Prints "METAPAGE TESTS PASS" (read by the headless test runner) when every
// trial that could run delivered all its frames, in order and intact.

import {
  formatBytes,
  loadLibrary,
  MODES,
  runTrial,
  showStatus,
  trialFailure,
} from "./metapage-test-pass-by-reference-trial.js";

const url = new URL(window.location.href);
const { version, isLatest, lib } = await loadLibrary();

const COUNT = parseInt(url.searchParams.get("count") || "30", 10);
const SIZES_KB = (url.searchParams.get("sizes") || "16,64,256,1024,4096")
  .split(",")
  .map((s) => parseFloat(s))
  .filter((n) => n > 0);
const TYPE = url.searchParams.get("type") || "Uint8Array";

const statusDiv = document.getElementById("status");
const resultsDiv = document.getElementById("results");
const framesDiv = document.getElementById("frames");

document.getElementById("count").value = COUNT;
document.getElementById("sizes").value = SIZES_KB.join(",");
document.getElementById("type").value = TYPE;

const rows = [];

const render = (done, failure) => {
  const header = `<tr>
    <th>frame size</th><th>mode</th><th>frames</th><th>arrived as</th>
    <th>total ms</th><th>ms / frame</th><th>MiB / s</th><th>speedup</th>
  </tr>`;
  const body = rows
    .map((r) => {
      const speedup =
        r.passByReference && r.baseline?.ms && r.ms
          ? `${(r.baseline.ms / r.ms).toFixed(1)}x`
          : r.passByReference && r.baseline?.error && r.ms
            ? "only this mode works"
            : "";
      const cells = r.error
        ? `<td colspan="5" style="color: #b00">✗ ${r.error}</td>`
        : r.ms === undefined
          ? `<td colspan="5">⌛</td>`
          : `<td>${r.ok ? "✓" : "✗"} ${r.count} ${r.type}</td>
             <td>${r.ms.toFixed(0)}</td>
             <td>${(r.ms / r.count).toFixed(2)}</td>
             <td>${((r.size * r.count) / 1024 / 1024 / (r.ms / 1000)).toFixed(0)}</td>`;
      return `<tr>
        <td>${formatBytes(r.size)}</td><td>${r.label}</td>
        ${r.error || r.ms === undefined ? cells : `<td>${r.count}</td>${cells}`}
        <td>${speedup}</td>
      </tr>`;
    })
    .join("");
  resultsDiv.innerHTML = `<table id="results-table">${header}${body}</table>`;
  showStatus(statusDiv, {
    done,
    failure,
    running: `running: ${COUNT} x ${TYPE} per trial, library ${version}`,
  });
};

let failure;
for (const sizeKb of SIZES_KB) {
  const size = Math.round(sizeKb * 1024);
  let baseline;
  for (const mode of MODES) {
    const row = { ...mode, size, baseline };
    rows.push(row);
    render(false);
    Object.assign(
      row,
      await runTrial({
        Metapage: lib.Metapage,
        isLatest,
        version,
        framesDiv,
        passByReference: mode.passByReference,
        size,
        count: COUNT,
        type: TYPE,
      }),
    );
    if (!mode.passByReference) {
      baseline = row;
    }
    const reason = trialFailure({ row, count: COUNT, sentType: TYPE, isLatest });
    if (reason) {
      failure ??= `${row.label} @ ${formatBytes(size)}: ${reason}`;
    }
  }
}
render(true, failure);
globalThis.passByReferenceResults = rows.map(({ baseline, ...r }) => r);
