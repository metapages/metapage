// Message rate test for passByReference (#208): send many small messages
// from a producer metaframe to a consumer metaframe, back to back, with
// passByReference off (the default) and on, and compare messages / second.
// Unlike the size test (metapage-test-pass-by-reference.js) this measures
// the cost per message, not per byte.
//
// URL: /test/metapage/pass-by-reference-rate/<version>?count=5000&size=1024&types=json,Uint8Array,Blob
//   count  messages per trial
//   size   bytes per binary message (json messages are a small object)
//   types  json | Uint8Array | ArrayBuffer | Blob, comma separated
//
// Prints "METAPAGE TESTS PASS" (read by the headless test runner) when every
// trial delivered all its messages, in order and intact.

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

const COUNT = parseInt(url.searchParams.get("count") || "5000", 10);
const SIZE = parseInt(url.searchParams.get("size") || "1024", 10);
const TYPES = (url.searchParams.get("types") || "json,Uint8Array,Blob")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s);

const statusDiv = document.getElementById("status");
const resultsDiv = document.getElementById("results");
const framesDiv = document.getElementById("frames");

document.getElementById("count").value = COUNT;
document.getElementById("size").value = SIZE;
document.getElementById("types").value = TYPES.join(",");

const rows = [];

const render = (done, failure) => {
  const header = `<tr>
    <th>message</th><th>mode</th><th>messages</th><th>arrived as</th>
    <th>total ms</th><th>ms / message</th><th>messages / s</th><th>speedup</th>
  </tr>`;
  const body = rows
    .map((r) => {
      const speedup =
        r.passByReference && r.baseline?.ms && r.ms
          ? `${(r.baseline.ms / r.ms).toFixed(1)}x`
          : "";
      const cells = r.error
        ? `<td colspan="5" style="color: #b00">✗ ${r.error}</td>`
        : r.ms === undefined
          ? `<td colspan="5">⌛</td>`
          : `<td>${r.ok ? "✓" : "✗"} ${r.count} ${r.type}</td>
             <td>${r.ms.toFixed(0)}</td>
             <td>${(r.ms / r.count).toFixed(3)}</td>
             <td>${Math.round(r.count / (r.ms / 1000))}</td>`;
      return `<tr>
        <td>${r.sentType === "json" ? "json object" : `${r.sentType} ${formatBytes(SIZE)}`}</td>
        <td>${r.label}</td>
        ${r.error || r.ms === undefined ? cells : `<td>${r.count}</td>${cells}`}
        <td>${speedup}</td>
      </tr>`;
    })
    .join("");
  resultsDiv.innerHTML = `<table id="results-table">${header}${body}</table>`;
  showStatus(statusDiv, {
    done,
    failure,
    running: `running: ${COUNT} messages per trial, library ${version}`,
  });
};

let failure;
for (const type of TYPES) {
  let baseline;
  for (const mode of MODES) {
    const row = { ...mode, sentType: type, baseline };
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
        size: SIZE,
        count: COUNT,
        type,
      }),
    );
    if (!mode.passByReference) {
      baseline = row;
    }
    const reason = trialFailure({ row, count: COUNT, sentType: type, isLatest });
    if (reason) {
      failure ??= `${row.label} @ ${type}: ${reason}`;
    }
  }
}
render(true, failure);
globalThis.passByReferenceRateResults = rows.map(({ baseline, ...r }) => r);
