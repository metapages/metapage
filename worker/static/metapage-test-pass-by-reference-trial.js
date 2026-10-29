// Shared by the passByReference speed tests (#208):
//   /test/metapage/pass-by-reference       throughput by frame size
//   /test/metapage/pass-by-reference-rate  messages / second
//
// A trial streams `count` values from a producer metaframe to a consumer
// metaframe (static/metaframe-pass-by-reference) in a fresh metapage, timed
// from the producer starting until the consumer has every value.

const TRIAL_TIMEOUT_MS = 60000;

export const MODES = [
  { passByReference: false, label: "serialized (data url)" },
  { passByReference: true, label: "pass by reference" },
];

// The serialized mode cannot encode large frames at all: it base64 encodes
// with String.fromCharCode(...bytes), which overflows the call stack. That is
// recorded as a result, not a test failure.
export const SERIALIZATION_LIMIT_PATTERN = /call stack|too many arguments/i;

/** The library version in /test/metapage/<test>/<version>, and its module */
export const loadLibrary = async () => {
  const urlPathElements = new URL(window.location.href).pathname
    .split("/")
    .filter((e) => e !== "");
  const version = urlPathElements[3] || "latest";
  const isLatest = version.startsWith("latest");
  const lib = await import(
    isLatest
      ? "/lib/index.js"
      : `https://cdn.jsdelivr.net/npm/@metapages/metapage@${version}`
  );
  return { version, isLatest, lib };
};

export const formatBytes = (n) =>
  n < 1024
    ? `${n} B`
    : n >= 1024 * 1024
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

/**
 * Run one trial. Resolves with {ms, count, type, ok} or {error}.
 *
 * type: Uint8Array | ArrayBuffer | Blob | json (a small plain object)
 */
export const runTrial = async ({
  Metapage,
  isLatest,
  version,
  framesDiv,
  passByReference,
  size,
  count,
  type,
}) => {
  const frameUrl = (role) =>
    `${window.location.origin}/metaframe-pass-by-reference/?role=${role}&version=${
      isLatest ? "latest" : version
    }`;
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
      "producer preparing values",
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
      `${count} values arriving`,
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

/**
 * Why a finished trial counts as a failure, or undefined if it does not.
 * `sentType` is what the producer sent: by reference it must arrive as that.
 */
export const trialFailure = ({ row, count, sentType, isLatest }) => {
  if (row.error) {
    const expected =
      !row.passByReference && SERIALIZATION_LIMIT_PATTERN.test(row.error);
    return expected ? undefined : row.error;
  }
  if (!(row.ok && row.count === count)) {
    return "values missing, out of order or corrupted";
  }
  const expectedType = sentType === "json" ? "Object" : sentType;
  if (isLatest && row.passByReference && row.type !== expectedType) {
    return `arrived as ${row.type}, sent as ${expectedType}`;
  }
  return undefined;
};

export const showStatus = (statusDiv, { done, failure, running }) => {
  if (!done) {
    statusDiv.textContent = running;
  } else if (failure) {
    document.body.style.backgroundColor = "#fdd";
    statusDiv.innerHTML = `TESTS FAIL:<br/>${failure}`;
  } else {
    // This piece of text is used by headless chrome in the test runner
    statusDiv.textContent = "METAPAGE TESTS PASS";
  }
};
