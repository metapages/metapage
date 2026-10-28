# #40: `postMessage` target origin does not match the recipient window's origin

**Status: fixed** with option B plus option C, origins strictly matched (see
[What was implemented](#what-was-implemented)). The analysis below describes
the behaviour before the fix.

```
Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('…') does not match the recipient window's origin ('…')
```

## Where the error comes from

The parent sends every message to a metaframe from one place,
`MetapageIFrameRpcClient.sendOrBufferPostMessage` (`lib/src/metapage/MetapageIFrameRpcClient.ts`):

```ts
this._iframe.contentWindow.postMessage(message, this.url);
```

The `targetOrigin` is the **configured** metaframe URL. The browser compares
the origin of that URL with the origin of the document **currently** in the
iframe. If they differ, Chrome logs the error and drops the message (it does not throw).
So the error appears whenever the iframe's document is not at the origin
of `this.url`.

(The child side is fine: `Metaframe.sendRpc` posts to the parent with `"*"`.)

## Reproduced triggers

`discussions/40-postmessage-origin-probe.cjs` runs each case in headless
Chromium against a running stack. Results from the
`40-postmessage-origin-mismatch` preview:

| # | Case | Console | Effect |
|---|------|---------|--------|
| – | baseline `https://js.mtfm.io/` | none | registers |
| 1 | metaframe URL **redirects cross-origin** (`https://redirect.test/` → 302 → `https://js.mtfm.io/`) | `target origin provided ('https://redirect.test') does not match … ('https://js.mtfm.io')`, repeated on every child retry | **never registers.** The metaframe stays blank permanently |
| 2 | **`data:` URL** metaframe (the constructor explicitly allows these) | uncaught `SyntaxError: Invalid target origin 'data:text/html,…'` | **never registers** |
| 3 | `setDefinition` **changes a metaframe URL to another origin** while inputs flow (`js.mtfm.io` → `markdown.mtfm.io`) | ~170 × `target origin provided ('https://markdown.mtfm.io') does not match … ('https://js.mtfm.io')` | noisy, but recovers: on re-registration `registered()` re-sends all current inputs |

Same mechanism as 1, not separately probed:

- A metaframe that **navigates itself** to another origin, e.g. an OAuth
  login round trip or a plain link. The parent keeps posting to the old origin.
- `http://` ↔ `https://`, `www.` ↔ apex, or `localhost` ↔ `127.0.0.1`
  mismatches between the URL in the definition and where the page ends up.
- A future `sandbox` attribute without `allow-same-origin`. `sandbox` is in the
  v2 metaframe types but is not applied to the iframe today. The document's
  origin would be `"null"`.

### Why 3 happens

`Metapage.setDefinition` (around `Metapage.ts:695`) sets `client.url = newUrl`
and then `client._iframe.src = newUrl`. `_loaded` stays `true`, so
`sendRpc` keeps posting immediately. Until the new document commits, those
messages target the new origin but reach the old document. They are dropped
with the error. Nothing is lost permanently, because re-registration re-sends inputs.

## Would listening to iframe `onload` fix it?

In the similar repo, the suggested fix was to wait for the iframe's `load`
event before posting. That works when the **parent starts** the handshake.
Here the **child starts it**: the parent never posts until it receives
`SetupIframeClientRequest` from the child (`register()` answers it, and
`sendRpc` queues until `registered()`). Receiving that request already proves
the child document has loaded. So on first load, `onload` gives no information
the parent doesn't already have.

For each case:

- **1 (redirect) and 2 (`data:`)**: `onload` does not help. The loaded document
  is still at a different origin from `this.url`. A cross-origin iframe
  doesn't expose its location, so the parent can't learn the real origin from `onload`.
- **3 (parent changes src)**: `onload` fires *after* the new document loads,
  which is too late for messages sent during the transition. The precise
  signal is "we are about to change `src`", and the parent controls that.
- **Self-navigation**: `onload` is the only signal the parent gets, but it
  races with the child's `SetupIframeClientRequest`. Both fire around the
  child's `load`. If the parent sets `_loaded = false` in `onload` after
  `registered()` has already set it `true`, the client stays unregistered.
  The child stops retrying once it is Ready, so messages queue forever. A
  naive `onload` handler could turn noise into a hang.

So `onload` alone is not the right fix here.

## Options for a fix (for review)

### A. Reply to the origin that actually registered (not chosen)

In `Metapage.onMessage`, for `SetupIframeClientRequest`:

1. Accept the request only if `e.source === client._iframe.contentWindow`.
   Today `onMessage` checks neither `e.source` nor `e.origin`. Matching only
   on `iframeId`/`parentId` is weaker than necessary.
2. Store `e.origin` on the client, say as `client._targetOrigin`, and use it in
   `sendOrBufferPostMessage` in place of `this.url`. If the origin is `"null"`
   (`data:`, or sandboxed without `allow-same-origin`), use `"*"`. Step 1's
   `e.source` check is what scopes that.

This fixes 1, 2 and self-navigation, because each new document re-registers
with its real origin. It also fixes 3 if combined with B.

**Trade-off to decide:** the current code means "only send inputs to the
origin written in the definition". Option A changes that to "send inputs to
whatever document the configured URL ended up loading in our iframe".
Two things to weigh:

- In my view this doesn't widen the trust boundary in practice. The configured
  page already gets the inputs and can forward them anywhere, or navigate
  itself anywhere, at will.
- It does matter for **open redirects** and for **secrets injected into URLs**
  (`_originalSecretHashParams` / `_originalSecretQueryParams`). With A, an
  input containing a secret goes to the redirect target.

  If that's not acceptable, keep strict matching but turn the silent hang into
  an explicit `metapage.error(...)`: "metaframe `a` loaded at origin X but is
  configured as Y". The `e.origin` from the registration request makes that
  diagnosable. This is option C.

### B. Stop sending while the parent swaps `src`

Where the parent assigns `_iframe.src` (`setDefinition`, and the constructor),
set `_loaded = false` so `sendRpc` queues until the new document
re-registers. `registered()` already flushes the queue in FIFO order and
re-sends all inputs. This fixes 3 without touching origins. It's small and
safe on its own.

### C. Strict origins, but say so

Keep `this.url` as the target. When a `SetupIframeClientRequest` arrives from
our iframe (`e.source` matches) with an `e.origin` that differs, emit an error
naming both origins. Use `"*"`, or reject explicitly, for `data:` URLs instead
of throwing `SyntaxError`. This is the smallest behavioural change, but redirects stay broken.

### Review corrections

- **A's `"*"` fallback is not scoped by the `e.source` check.** That check only
  decides whose *registration* is accepted. Every later `postMessage(msg, "*")`
  goes to whatever document is in the iframe when it is sent, including a page
  the metaframe navigated to.
- **A needs plumbing.** `onMessage` only passes `e.data` on, and
  `onMessageJsonRpc` is also called internally with no event
  (`setMetaframeOutputs`).
- **B has its own race.** An old document's in-flight
  `SetupIframeServerResponseAck` can arrive after `_loaded = false` and set it
  back to `true`. B only applies where `setDefinition` swaps `src`: in the
  constructor `_loaded` already starts `false`.

## What was implemented

- **B:** `MetapageIFrameRpcClient.setUrl()` is now the only way the parent
  changes a live iframe's `src` (`setDefinition` uses it). It sets
  `_loaded = false`, so messages queue until the new document registers. Then
  `registered()` flushes the queue and re-sends all inputs.
- **B's race:** `setUrl()` also sets `_awaitingSetupRequest`. `registered()`
  ignores acks until the next `SetupIframeClientRequest` reaches `register()`,
  so a late ack from the old document can't re-open the gate. If the origin
  changed, the origin check below drops that ack as well.
- **C, strict origins:**
  - `onMessage` passes the event to `onMessageJsonRpc(jsonrpc, event?)`.
    Messages with an event are accepted only if
    `e.source === iframe.contentWindow` and `e.origin` is the origin of the
    configured url (`client.expectedOrigin`). Internal calls have no event and
    are trusted, as before.
  - A registration request from our iframe at another origin emits a metapage
    `Error` naming both origins. It is emitted once per origin, not on every
    child retry. The metaframe stays unconnected, so inputs never go to an
    origin that isn't in the definition.
- **`data:` urls:** the target is `"*"` (`client.targetOrigin`), because an
  opaque origin can't be targeted. Incoming messages must still come from our
  iframe with origin `"null"`.
  - Remaining risk, accepted: a `data:` metaframe that navigates itself away
    keeps receiving messages until something re-registers.
  - Why it's acceptable: its content is written inline in the definition, so
    it is as trusted as the metapage.
- **Tests:** `lib/tests/origin.test.ts`. 9 of its 11 tests fail without the
  fix.
  - `lib/tests/dataurl.test.ts` didn't catch case 2 because it only checks that
    `data:` urls survive `setDefinition`/`getDefinition`. It never runs a
    handshake.
  - The real cross-origin redirect is still only exercised by the probe
    script. Vitest's single-origin server can't serve one, so the tests
    simulate the redirect with `MessageEvent`s that carry `source` and `origin`.

## Do any of our checks duplicate the browser's?

No. The browser enforces only one direction:

- **Outgoing (parent → metaframe):** `postMessage(msg, targetOrigin)` is
  enforced by the browser. It drops the message if the iframe's document is at
  another origin. We only compute `targetOrigin`; we never re-check it.
- **Incoming (metaframe → parent):** the browser filters nothing. Any window
  that can reach ours (another iframe, a popup, an opener, the old document) can
  post to it, and `iframeId`/`parentId` are just fields it can fill in.
  `parentId` isn't secret either: a metapage can be given a fixed `opts.id`.
  So the incoming checks are ours to make, and each one catches something the
  other misses:
  - `e.source === iframe.contentWindow` rejects every window other than our
    iframe. `e.origin` alone can't do this: another window at the metaframe's
    origin would pass.
  - `e.origin === expectedOrigin` rejects a different document in *our*
    iframe. `e.source` alone can't do this, because the iframe's `WindowProxy`
    stays the same when it navigates or redirects. Without it, a page the
    metaframe navigated to could still push outputs into the graph, since
    `OutputsUpdate` isn't gated on registration.
  - Tests for both: "ignores a window other than our iframe…" and "only
    accepts outputs from the expected origin" in `lib/tests/origin.test.ts`.

Partial overlaps, kept on purpose:

- `_awaitingSetupRequest` is redundant with the origin check only when the
  url swap changes origin. For a same-origin swap it is the only thing that
  drops the old document's late ack.
- The older `jsonrpc.parentId !== this._id` check ("ignore messages from other
  metapages") is now covered by the `e.source` check for browser messages: a
  metaframe of another metapage on the same page lives in a different iframe.
  It is left in as a cheap early filter. It never wrongly rejects anything,
  because internal calls set `parentId` to our own id.
