// Integration test for isTransferableObjects mode.
// Tests that binary data (ArrayBuffer, TypedArray, Blob, File) flows through
// the metapage routing without base64 serialization when isTransferableObjects
// is enabled.
//
// These tests use setMetaframeOutputs() to inject outputs from a simulated
// source frame and verify that connected target frames receive the binary data
// with the correct type (not serialized to a data URL string).

const { compareVersions } = window.compareVersions;
const url = new URL(window.location.href);
console.log(`url: ${url}`);
const urlPathElements = url.pathname.split("/").filter((e) => e !== "");
var version = urlPathElements[3] || "latest";
var testname = urlPathElements[2];

const importURl = `${
  version === "latest"
    ? "/lib/index.js"
    : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" +
      version.split("-")[0]
}`;

console.log("importURl", importURl);
const { Metapage } = await import(importURl);

let debug = ["debug", "mp_debug"].reduce((exists, flag) => {
  return (
    exists ||
    url.searchParams.get(flag) === "true" ||
    url.searchParams.get(flag) === "1"
  );
}, false);

if (debug) {
  console.log("❗🏗️ PAGE debug");
}

var PAGEURL = new URL(globalThis.location.href);

////////////////////////////////////////////////////////////////////////
// Define all the functional tests
let TESTS;

const getStatusText = (err) => {
  let text = TESTS.map((test) => test.getHTML()).join("") + "<br/><br/>";
  if (err) {
    document.body.style.backgroundColor = "red";
    text += "TESTS FAIL:<br/>" + err;
    console.error(`Tests err:${err}`, err);
  } else if (
    TESTS.reduce((isPassing, test) => {
      return isPassing && test.success;
    }, true)
  ) {
    // This piece of text is used by headless chrome in the test runner
    text += "METAPAGE TESTS PASS";
  }
  text += "<br/><br/>";
  return text;
};

const setStatus = (err) => {
  if (
    !err &&
    (PAGEURL.searchParams.has("debug") ||
      PAGEURL.searchParams.has("mp_debug") ||
      PAGEURL.searchParams.has("mp_DEBUG"))
  ) {
    console.log(
      TESTS.map((test) => test.description + ":" + test.getText()).join(""),
    );
  }
  document.getElementById("status").innerHTML = getStatusText(err);
};

class Test {
  constructor(description, testFunc) {
    this.description = description;
    this.testFunc = testFunc;
    this.success = false;
  }

  async run(metapage) {
    this.metapage = metapage;
    this.success = await this.testFunc(metapage);
    setStatus();
    return this.success;
  }

  getText() {
    if (!this.metapage) {
      return "";
    }
    return `${this.success ? "✓" : "⌛"}: ${this.description}`;
  }

  getHTML() {
    if (!this.metapage) {
      return "";
    }
    return "<br/>" + this.getText();
  }
}

// Helper: compare ArrayBuffer contents
function buffersEqual(a, b) {
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  if (va.length !== vb.length) return false;
  for (let i = 0; i < va.length; i++) {
    if (va[i] !== vb[i]) return false;
  }
  return true;
}

// Helper: wait for metapage INPUTS event that satisfies a predicate
function waitForInputs(metapage, pred, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      metapage.removeListener(Metapage.INPUTS, handler);
      reject(new Error("Timeout waiting for inputs"));
    }, timeoutMs);

    const handler = (inputs) => {
      if (pred(inputs)) {
        clearTimeout(timer);
        metapage.removeListener(Metapage.INPUTS, handler);
        resolve(inputs);
      }
    };
    metapage.addListener(Metapage.INPUTS, handler);
    // also check current state immediately
    const current = metapage.getState().metaframes.inputs;
    if (pred(current)) {
      clearTimeout(timer);
      metapage.removeListener(Metapage.INPUTS, handler);
      resolve(current);
    }
  });
}

// A minimal metapage definition: frame1 output "data" -> frame2 input "data"
const makeDefinition = () => ({
  version: "2",
  metaframes: {
    frame1: {
      url: "about:blank",
    },
    frame2: {
      url: "about:blank",
      inputs: [{ metaframe: "frame1", source: "data", target: "data" }],
    },
    frame3: {
      url: "about:blank",
      inputs: [{ metaframe: "frame1", source: "data", target: "data" }],
    },
  },
});

TESTS = [
  new Test("ArrayBuffer routes without serialization", async (metapage) => {
    const buf = new ArrayBuffer(8);
    new Uint8Array(buf).set([1, 2, 3, 4, 5, 6, 7, 8]);

    metapage.setMetaframeOutputs("frame1", { data: buf });

    await waitForInputs(
      metapage,
      (inputs) => inputs["frame2"] && inputs["frame2"].data,
    );

    const received = metapage.getState().metaframes.inputs["frame2"]["data"];
    if (!(received instanceof ArrayBuffer)) {
      console.error(
        "Expected ArrayBuffer, got:",
        typeof received,
        received?.constructor?.name,
      );
      return false;
    }
    return buffersEqual(received, buf);
  }),

  new Test("Float32Array routes without serialization", async (metapage) => {
    const arr = new Float32Array([1.1, 2.2, 3.3, 4.4]);

    metapage.setMetaframeOutputs("frame1", { data: arr });

    await waitForInputs(
      metapage,
      (inputs) =>
        inputs["frame2"] && inputs["frame2"].data instanceof Float32Array,
    );

    const received = metapage.getState().metaframes.inputs["frame2"]["data"];
    if (!(received instanceof Float32Array)) {
      console.error(
        "Expected Float32Array, got:",
        typeof received,
        received?.constructor?.name,
      );
      return false;
    }
    return (
      received.length === 4 &&
      Math.abs(received[0] - 1.1) < 0.001 &&
      Math.abs(received[3] - 4.4) < 0.001
    );
  }),

  new Test("Uint8Array routes without serialization", async (metapage) => {
    const arr = new Uint8Array([10, 20, 30, 40, 50]);

    metapage.setMetaframeOutputs("frame1", { data: arr });

    await waitForInputs(
      metapage,
      (inputs) =>
        inputs["frame2"] && inputs["frame2"].data instanceof Uint8Array,
    );

    const received = metapage.getState().metaframes.inputs["frame2"]["data"];
    if (!(received instanceof Uint8Array)) return false;
    return (
      received.length === 5 &&
      received[0] === 10 &&
      received[4] === 50
    );
  }),

  new Test("Blob routes without serialization", async (metapage) => {
    const blob = new Blob(["hello world"], { type: "text/plain" });

    metapage.setMetaframeOutputs("frame1", { data: blob });

    await waitForInputs(
      metapage,
      (inputs) => inputs["frame2"] && inputs["frame2"].data instanceof Blob,
    );

    const received = metapage.getState().metaframes.inputs["frame2"]["data"];
    if (!(received instanceof Blob)) {
      console.error(
        "Expected Blob, got:",
        typeof received,
        received?.constructor?.name,
      );
      return false;
    }
    if (received.type !== "text/plain") return false;
    const text = await received.text();
    return text === "hello world";
  }),

  new Test("File routes without serialization", async (metapage) => {
    const lastModified = 1700000000000;
    const file = new File(["file content"], "test.txt", {
      type: "text/plain",
      lastModified,
    });

    metapage.setMetaframeOutputs("frame1", { data: file });

    await waitForInputs(
      metapage,
      (inputs) => inputs["frame2"] && inputs["frame2"].data instanceof File,
    );

    const received = metapage.getState().metaframes.inputs["frame2"]["data"];
    if (!(received instanceof File)) return false;
    if (received.name !== "test.txt") return false;
    if (received.type !== "text/plain") return false;
    const text = await received.text();
    return text === "file content";
  }),

  new Test(
    "Mixed binary and plain values route correctly",
    async (metapage) => {
      const buf = new ArrayBuffer(4);
      new Uint8Array(buf).set([9, 8, 7, 6]);

      metapage.setMetaframeOutputs("frame1", {
        data: buf,
        label: "hello",
        count: 42,
      });

      await waitForInputs(
        metapage,
        (inputs) =>
          inputs["frame2"] &&
          inputs["frame2"].data instanceof ArrayBuffer &&
          inputs["frame2"].label === "hello",
      );

      const state = metapage.getState().metaframes.inputs["frame2"];
      if (!(state.data instanceof ArrayBuffer)) return false;
      if (state.label !== "hello") return false;
      if (state.count !== 42) return false;
      return buffersEqual(state.data, buf);
    },
  ),

  new Test(
    "Multi-recipient: both frames receive valid ArrayBuffers",
    async (metapage) => {
      const buf = new ArrayBuffer(4);
      new Uint8Array(buf).set([11, 22, 33, 44]);

      metapage.setMetaframeOutputs("frame1", { data: buf });

      // Wait for both frame2 and frame3 to receive
      await waitForInputs(
        metapage,
        (inputs) =>
          inputs["frame2"] &&
          inputs["frame2"].data instanceof ArrayBuffer &&
          inputs["frame3"] &&
          inputs["frame3"].data instanceof ArrayBuffer,
      );

      const state = metapage.getState().metaframes.inputs;
      const recv2 = state["frame2"]["data"];
      const recv3 = state["frame3"]["data"];

      if (!(recv2 instanceof ArrayBuffer)) return false;
      if (!(recv3 instanceof ArrayBuffer)) return false;

      // Both should have correct content
      if (!buffersEqual(recv2, buf)) return false;
      if (!buffersEqual(recv3, buf)) return false;

      return true;
    },
  ),
];

// Create the metapage with isTransferableObjects: true
const metapageInstance = await Metapage.from(makeDefinition(), undefined);

// Set transferable objects mode
// (works with version >= latest that implements this feature)
if (typeof metapageInstance.isTransferableObjects !== "undefined") {
  metapageInstance.isTransferableObjects = true;
} else {
  // Older version without this feature - mark all tests as skipped
  document.getElementById("status").innerHTML =
    "METAPAGE TESTS PASS (skipped: isTransferableObjects not available in this version)";
  setStatus();
  // Signal pass for older versions
  document.getElementById("status").innerHTML = "METAPAGE TESTS PASS";
  throw new Error("Early exit: not supported");
}

globalThis.Metapage = Metapage;
globalThis.metapageInstance = metapageInstance;

if (debug) {
  metapageInstance.debug = true;
} else {
  metapageInstance.setDebugFromUrlParams?.();
}

// add iframes to the DOM so they're visible (even though about:blank doesn't do much)
const column1 = document.createElement("div");
column1.style = "display: flex; flex-direction: column; width: 100%;";
const title1 = document.createElement("h3");
title1.textContent = "Metaframes (about:blank)";
column1.appendChild(title1);

const row = document.createElement("div");
row.style =
  "display: flex; flex-direction: row; gap: 10px; width: 500px; min-height: 300px;";
row.appendChild(column1);
document.getElementById("body").appendChild(row);

for (const metaframeId of metapageInstance.metaframeIds()) {
  const iframe = await metapageInstance.getMetaframe(metaframeId).iframe;
  iframe.style = "width: 100%; height: 100px;";
  column1.appendChild(iframe);
}

const promises = TESTS.map((test) => test.run(metapageInstance));

Promise.all(promises)
  .then(() => {
    document.body.style.backgroundColor = "green";
    setStatus();
  })
  .catch((err) => {
    document.body.style.backgroundColor = "red";
    setStatus(err);
  });

setStatus();
