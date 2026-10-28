# #40: `postMessage` target origin does not match the recipient window's origin

Discussion only: no library code changes. The issue asked for analysis and review before any fix.

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

### A. Reply to the origin that actually registered (recommended)

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

### Suggested path

Do B regardless. Then choose A (or A behind an opt-out) versus C based on
how much the "inputs only go to the configured origin" guarantee matters for
secret-bearing inputs. Each needs a browser test in `lib/tests`. Those run in
real Chromium via `vitest.browser.config.ts`: a same-origin page that
redirects cross-origin, a `data:` metaframe, and a URL swap under
`setInputs` load.
