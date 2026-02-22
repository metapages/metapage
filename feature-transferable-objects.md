# Feature: `isTransferableObjects` — Zero-Copy Binary Data

**Branch:** `transferable-objects`
**Status:** Implemented, unit-tested, E2E route scaffolded. Not yet published.

---

## Motivation

Previously, all binary data (`ArrayBuffer`, TypedArrays, `Blob`, `File`) crossing an iframe boundary was serialized to a base64 data-URL string by the sending metaframe, transmitted via `postMessage`, then decoded on the receiving side. This adds ~33 % size overhead and significant CPU cost for large payloads (ML tensors, audio buffers, image data).

The `isTransferableObjects` mode eliminates that overhead:

- `ArrayBuffer` / TypedArrays → passed via the native `postMessage` **transfer list** (zero-copy, ownership transfer)
- `Blob` / `File` → passed via the browser's **structured clone** algorithm (no encoding needed)
- Plain JSON values in the same `setOutputs` call → unchanged

---

## How to Enable

### On the metapage (parent) side

Pass the option at construction time:

```js
const metapage = new Metapage({ isTransferableObjects: true });
await metapage.setDefinition(definition);
```

Or set the property after construction (propagates to all existing metaframe clients immediately):

```js
const metapage = await Metapage.from(definition);
metapage.isTransferableObjects = true;
```

### On the metaframe (child) side

**No code changes are needed.** The mode is communicated automatically during the connection handshake (`SetupIframeServerResponse`). The metaframe reads `params.isTransferableObjects` and sets its own flag, which then controls whether `setOutputs` serializes or transfers.

```js
const metaframe = new Metaframe();

// Binary arrives as Float32Array — no manual deserialization
metaframe.onInput("tensor", (data) => {
  console.log(data instanceof Float32Array); // true
  runModel(data);
});

// Large buffers are transferred zero-copy
metaframe.setOutput("result", new Float32Array(1_000_000));

// Mixed binary + plain values work in the same call
metaframe.setOutputs({
  tensor: new Float32Array([1, 2, 3]),
  label:  "my-model",
  count:  42,
});
```

---

## Files Changed

### Modified

| File | What changed |
|------|-------------|
| `lib/src/metapage/v1/metapage.ts` | Added `isTransferableObjects?: boolean` to `MetapageOptionsV1` |
| `lib/src/metapage/jsonrpc.ts` | Added `isTransferableObjects?: boolean` to `SetupIframeServerResponseData` (parent tells child the mode during handshake) |
| `lib/src/metapage/data.ts` | Added `collectTransferables()` and `deepCopyInputsWithTransferables()` |
| `lib/src/metapage/Metapage.ts` | `_isTransferableObjects` field + getter/setter (setter propagates to all clients); constructor reads option; `addMetaframe` sets it on new clients; routing loop uses `deepCopyInputsWithTransferables` for multi-recipient case |
| `lib/src/metapage/MetapageIFrameRpcClient.ts` | `isTransferableObjects` property; `sendInputs` branches on mode; `register()` includes flag in setup response and uses transfer for initial inputs; added `sendRpcWithTransfer` / `sendRpcInternalWithTransfer`; `sendOrBufferPostMessage` accepts `transfer?: Transferable[]` and passes it through |
| `lib/src/metapage/Metaframe.ts` | `isTransferableObjects` property; `setOutputs` skips serialization and uses `collectTransferables` when flag is true; `sendRpc` accepts optional `transfer: Transferable[]`; `_resolveSetupIframeServerResponse` sets the flag from params and always calls `deserializeInputs` (safe no-op for binary); `setInternalInputsAndNotify` always calls `deserializeInputs` (see version compatibility) |

### New files

| File | Purpose |
|------|---------|
| `lib/tests/transferable.test.ts` | 25 Vitest unit tests for `collectTransferables`, `deepCopyInputsWithTransferables`, and the version-compatibility invariant |
| `worker/src/static/metapage-test-transferable.js` | E2E integration test (7 test cases via `setMetaframeOutputs`) |
| `worker/src/routes/test/metapage/transferable/index.tsx` | Version-picker page for the E2E test |
| `worker/src/routes/test/metapage/transferable/[version].tsx` | Test runner page |
| `worker/src/routes/test/metapage/transferable/metapage-test.js.ts` | Route handler that serves the static JS test file |

---

## Key Implementation Details

### `collectTransferables(obj, seen?)`

Recursively walks any value (object, array, or scalar):
- Collects `ArrayBuffer` directly
- Collects `.buffer` from any `ArrayBuffer.isView()` (TypedArray)
- Collects `ImageBitmap` if available
- Uses a `seen: Set<ArrayBuffer>` to deduplicate shared backing buffers (e.g., two typed-array views over the same buffer)
- Returns an empty array for `Blob`, `File`, strings, numbers, and plain objects — they do not go in the transfer list

### `deepCopyInputsWithTransferables(inputs)`

Used in the routing loop when one metaframe's output routes to **more than one** downstream metaframe. Because `ArrayBuffer` ownership transfers (the source is neutered after `postMessage`), each recipient needs its own copy:
- `ArrayBuffer` → `.slice(0)`
- TypedArray → `new Constructor(buf.slice(byteOffset, byteOffset + byteLength))`
- `Blob` / `File` → returned by reference (structured clone handles them)
- Scalars / plain objects → deep-copied recursively

With a single recipient, no copy is made.

### Handshake flow

```
Child iframe loads
  → sends SetupIframeClientRequest
Parent MetapageIFrameRpcClient.register()
  → sends SetupIframeServerResponse { isTransferableObjects: true, state: { inputs } }
  → if isTransferableObjects: collects transferables from inputs, sends with transfer list
Child Metaframe._resolveSetupIframeServerResponse()
  → sets this.isTransferableObjects = !!params.isTransferableObjects
  → always calls deserializeInputs on initial inputs (safe for binary, handles old-format fallback)
  → sends SetupIframeServerResponseAck
```

### Metaframe output flow (child → parent → sibling)

```
metaframe.setOutputs({ tensor: Float32Array })
  → skips serializeInputs (isTransferableObjects = true)
  → collectTransferables → [Float32Array.buffer]
  → window.parent.postMessage(message, "*", [Float32Array.buffer])

Parent onMessage receives message (buffer now owned by parent)
  → routes to connected metaframes
  → if N recipients > 1: deepCopyInputsWithTransferables for each
  → MetapageIFrameRpcClient.sendInputs({ tensor: Float32Array })
    → collectTransferables → [buffer]
    → iframe.contentWindow.postMessage(message, url, [buffer])

Sibling Metaframe.setInternalInputsAndNotify({ tensor: Float32Array })
  → deserializeInputs (no-op for binary — needed for version compat)
  → emits Input/Inputs events with Float32Array
```

---

## Version Compatibility

The critical invariant: `deserializeInputs` returns non-string values **unchanged** (`needsDeserialization()` returns `false` for `ArrayBuffer`, TypedArrays, `Blob`, `File`). This means it is safe to call unconditionally, even in transferable mode.

This handles mixed-version metapages:

| Sender | Receiver | What crosses the wire | Outcome |
|--------|----------|-----------------------|---------|
| Old metaframe (base64 encodes) | New metaframe (transferable mode) | Data URL string | Receiver's `deserializeInputs` decodes it — **correct** |
| New metaframe (transfers binary) | Old metaframe | ArrayBuffer via transfer | Old receiver's `deserializeInputs` is a no-op — **correct** |
| Old metapage (no flag) | New metaframe | Flag absent → `!!undefined === false` | Metaframe defaults to base64 mode — **correct** |

The bug that would have existed (and was fixed): the original implementation **skipped** `deserializeInputs` when `isTransferableObjects === true`. This broke the old-sender → new-receiver path. The fix was to always call `deserializeInputs` regardless of the mode.

---

## Tests

Run unit tests:
```bash
cd lib
node node_modules/vitest/vitest.mjs run --config=vitest.browser.config.ts
```
(117 tests pass, including 25 new ones in `transferable.test.ts`)

E2E test route (requires the worker dev server running):
```
https://localhost:4430/test/metapage/transferable/latest
```

The E2E tests use `metapage.setMetaframeOutputs()` to inject binary values and verify that connected metaframes receive binary types (not strings) via the metapage INPUTS event and state. The 7 test cases cover: `ArrayBuffer`, `Float32Array`, `Uint8Array`, `Blob`, `File`, mixed binary+plain, and multi-recipient deep-copy.

---

## Potential Follow-Up Work

### 1. Per-frame mode negotiation (optimization)

Currently, `isTransferableObjects` is a global flag on the `Metapage` and is propagated uniformly to all frame clients. A finer-grained approach would:
- Check the metaframe's reported library version (available after `registered(version)` is called)
- Determine whether that specific version supports transferable mode
- Only send binary via transfer to frames that support it; serialize for older frames

This would be an optimization (reducing unnecessary `deserializeInputs` calls on old frames) but is not required for correctness — the current fallback deserialization handles it.

### 2. Metapage state neutering

When a `ArrayBuffer` is transferred from a child frame to the parent via `postMessage`, the parent owns it. The parent then stores it in `this._state` (via `setOutputStateOnlyMetaframeInputMap`) and also routes it to downstream frames (which transfers it again). After the second transfer, the `ArrayBuffer` stored in the metapage state is **neutered** (detached, `byteLength === 0`).

This is a known trade-off with transferable objects. If the metapage state is inspected after routing (e.g., `metapage.getState().metaframes.outputs["frameA"].tensor`), the ArrayBuffer will be detached.

A fix would be to deep-copy the ArrayBuffer before storing in state, and transfer the copy. But this adds one extra copy per routing event.

### 3. `Metaframe.setInputs()` transfer support

`Metaframe.setInputs()` (the method that tells the parent metapage to update this frame's stored inputs) does not currently use the transfer list even in transferable mode. This is a rarely-used code path but could be made consistent.

### 4. Dynamic mode change notification

If `metapage.isTransferableObjects` is changed **after** frames have already completed their handshake, those frames' `isTransferableObjects` flag is updated on the `MetapageIFrameRpcClient` side (so future `sendInputs` calls use the new mode), but the frames themselves (child `Metaframe` instances) are not re-notified. A new RPC message type would be needed to propagate dynamic mode changes to already-connected frames.

For now, `isTransferableObjects` should be set before the metapage definition is rendered into the DOM (before iframes load and connect).

### 5. Real iframe E2E tests

The current E2E test uses `setMetaframeOutputs()` to simulate frame outputs from outside, which tests the routing path but not the actual postMessage+transfer path from within a live iframe. A full round-trip test would need metaframes that:
1. Send binary from within their iframe context
2. Receive binary and signal success back to the test page

This requires either hosting test metaframe HTML locally (blob: URL iframes have postMessage origin constraints with `targetOrigin = this.url`) or using the existing test infrastructure at `js.mtfm.io`.
