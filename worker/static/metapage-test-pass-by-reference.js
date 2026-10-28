// Speed test for passByReference (#208): stream binary frames from a
// producer metaframe to a consumer metaframe, once with base64 data url
// serialization (the default) and once passed as-is by postMessage, and
// compare.
//
// URL: /test/metapage/pass-by-reference/<version>?count=30&sizes=16,256,1024&type=Uint8Array
//   count  frames per trial
//   sizes  frame sizes in KiB, comma separated
//   type   Uint8Array | ArrayBuffer | Blob
//
// Prints "METAPAGE TESTS PASS" (read by the headless test runner) when every
// trial that could run delivered all its frames, in order and intact.

const url = new URL(window.location.href);
const urlPathElements = url.pathname.split("/").filter((e) => e !== "");
const version = urlPathElements[3] || "latest";
const isLatest = version.startsWith("latest");

const { Metapage } = await import(
  isLatest
    ? "/lib/index.js"
    : `https://cdn.jsdelivr.net/npm/@metapages/metapage@${version}`
);

const COUNT = parseInt(url.searchParams.get("count") || "30", 10);
const SIZES_KB = (url.searchParams.get("sizes") || "16,64,256,1024,4096")
  .split(",")
  .map((s) => parseFloat(s))
  .filter((n) => n > 0);
const TYPE = url.searchParams.get("type") || "Uint8Array";
const TRIAL_TIMEOUT_MS = 60000;
// The serialized mode cannot encode large frames at all: it base64 encodes
// with String.fromCharCode(...bytes), which overflows the call stack. That is
// recorded as a result, not a test failure.
const SERIALIZATION_LIMIT_PATTERN = /call stack|too many arguments/i;

const MODES = [
  { passByReference: false, label: "serialized (data url)" },
  { passByReference: true, label: "pass by reference" },
];

const statusDiv = document.getElementById("status");
const resultsDiv = document.getElementById("results");
const framesDiv = document.getElementById("frames");

document.getElementById("count").value = COUNT;
document.getElementById("sizes").value = SIZES_KB.join(",");
document.getElementById("type").value = TYPE;

const frameUrl = (role) =>
  `${window.location.origin}/metaframe-pass-by-reference/?role=${role}&version=${
    isLatest ? "latest" : version
  }`;

const formatBytes = (n) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(n % (1024 * 1024) ? 1 : 0)} MiB`
    : `${(n / 1024).toFixed(n % 1024 ? 1 : 0)} KiB`;

/** Resolve with the first truthy predicate(state), checked on every state change */
const waitForState = (metapage, predicate, timeoutMs, description) =>
  new Promise((resolve, reject) => {
    let disposer;
    const timer = setTimeout(() => {
      disposer?.();
      reject(new Error(`timed out after ${timeoutMs}ms: ${description}`));
    }, timeoutMs);
    const check = () => {
      const result = predicate(metapage.getState().metaframes);
      if (result) {
        clearTimeout(timer);
        disposer?.();
        resolve(result);
      }
    };
    disposer = metapage.onState(check);
    check();
  });

const runTrial = async ({ passByReference, size, count, type }) => {
  const metapage = new Metapage({ passByReference });
  const container = document.createElement("div");
  container.style.display = "flex";
  framesDiv.replaceChildren(container);
  try {
    await metapage.setDefinition({
      version: "2",
      metaframes: {
        producer: { url: frameUrl("producer") },
        consumer: {
          url: frameUrl("consumer"),
          inputs: [{ metaframe: "producer", source: "frame", target: "frame" }],
        },
      },
    });
    for (const id of metapage.getMetaframeIds()) {
      const iframe = await metapage.getMetaframe(id).iframe;
      iframe.style.width = "320px";
      iframe.style.height = "40px";
      container.appendChild(iframe);
    }

    await waitForState(
      metapage,
      ({ outputs }) => outputs.producer?.ready && outputs.consumer?.ready,
      TRIAL_TIMEOUT_MS,
      "metaframes connecting",
    );

    const runId = `${Date.now()}-${Math.random()}`;
    metapage.setInput("consumer", "expect", { runId, count });
    metapage.setInput("producer", "prepare", { runId, count, size, type });
    await waitForState(
      metapage,
      ({ outputs }) => outputs.producer?.prepared === runId,
      TRIAL_TIMEOUT_MS,
      "producer preparing frames",
    );

    const start = performance.now();
    metapage.setInput("producer", "go", runId);
    const outcome = await waitForState(
      metapage,
      ({ outputs }) =>
        (outputs.consumer?.done?.runId === runId && {
          done: outputs.consumer.done,
        }) ||
        (outputs.producer?.error?.runId === runId && {
          error: outputs.producer.error.message,
        }),
      TRIAL_TIMEOUT_MS,
      `${count} frames arriving`,
    );
    const ms = performance.now() - start;
    if (outcome.error) {
      return { error: outcome.error };
    }
    return { ms, ...outcome.done };
  } catch (err) {
    return { error: `${err?.message ?? err}` };
  } finally {
    metapage.dispose();
    framesDiv.replaceChildren();
  }
};

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

  if (!done) {
    statusDiv.textContent = `running: ${COUNT} x ${TYPE} per trial, library ${version}`;
  } else if (failure) {
    document.body.style.backgroundColor = "#fdd";
    statusDiv.innerHTML = `TESTS FAIL:<br/>${failure}`;
  } else {
    // This piece of text is used by headless chrome in the test runner
    statusDiv.textContent = "METAPAGE TESTS PASS";
  }
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
        passByReference: mode.passByReference,
        size,
        count: COUNT,
        type: TYPE,
      }),
    );
    if (!mode.passByReference) {
      baseline = row;
    }
    const expectedFailure =
      row.error &&
      !mode.passByReference &&
      SERIALIZATION_LIMIT_PATTERN.test(row.error);
    if (row.error && !expectedFailure) {
      failure ??= `${row.label} @ ${formatBytes(size)}: ${row.error}`;
    } else if (!row.error && !(row.ok && row.count === COUNT)) {
      failure ??= `${row.label} @ ${formatBytes(size)}: frames missing, out of order or corrupted`;
    } else if (
      !row.error &&
      isLatest &&
      mode.passByReference &&
      row.type !== TYPE
    ) {
      failure ??= `${row.label} @ ${formatBytes(size)}: arrived as ${row.type}, sent as ${TYPE}`;
    }
  }
}
render(true, failure);
globalThis.passByReferenceResults = rows.map(({ baseline, ...r }) => r);
