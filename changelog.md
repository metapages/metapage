# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.17] - 2026-10-28
### Fixed
- Two remaining ways a stale input could win while a metaframe registers (#200).
  An input that arrived while the buffered mid-registration inputs were still
  being applied could be overwritten by an older buffered one. And when a
  metaframe re-registered with a recreated parent, it stayed `Ready` while
  deserializing the new parent's initial inputs, so a newer update from that
  parent was applied first and then overwritten by the (older) initial value.
- A metaframe whose initial inputs contained a value that failed to deserialize
  (e.g. a malformed dataref) never finished registering: it stayed not `Ready`
  and held every later input in its buffer forever (#200). The bad value is
  now passed through as-is, an `error` event is emitted, and registration
  completes. Input updates fail the same way: one bad value no longer drops
  the rest of the update silently.
- A metaframe disposed while it was still registering no longer throws
  `TypeError: ... is undefined` from `merge`. Registration awaits the
  deserialization of the parent's initial inputs, and `dispose()` landing in
  that window (React StrictMode does it on every dev mount) made it merge into
  the cleared input map. A disposed metaframe now abandons its registration: it
  no longer acks the parent or emits inputs either.

## [1.10.15] - 2026-10-22
### Fixed
- Inputs are no longer lost when a metaframe connects or reconnects. A metaframe
  reloads for all sorts of reasons (it navigates itself, the metapage changes its
  url, the iframe element is moved in the DOM) and the parent cannot see that
  happen, so it kept posting inputs into a document that was going away and only
  ever sent the full input set on the *first* registration. The metaframe also
  threw away (literally: `throw`) any input that arrived while it was still
  registering, a window that can include a network fetch when deserializing url
  datarefs. Now the parent sends all current inputs on every registration, and
  the metaframe buffers anything that arrives mid-registration instead of
  dropping it.
- Input updates are applied in the order they arrived. Applying one is
  asynchronous (deserializing a url dataref fetches it), so a slow update could
  land after a later fast one and leave a stale value as the final state.
- Queued messages to a not-yet-registered metaframe are flushed in the order
  they were queued (they were sent in reverse).
- A metaframe re-registers when answered by a metapage with a different id,
  instead of ignoring it and then rejecting every input it sends. Only the
  window embedding the metaframe can register it.

## [1.10.12]
### Fixed
- Metaframes no longer stay permanently blank when the parent page loads after them.
  The registration handshake was order-dependent: the child sent
  `SetupIframeClientRequest` exactly once and the parent only attached its
  postMessage listener on its own page load, so a single missed request was fatal
  and silent. Now the child retries until answered (backing off to 5s), and the
  parent listens from construction, buffering messages until its page has loaded.

## [0.5.3] - 2021-04-18
### Added
- `metapage` and `metaframe` objects do not start communication until the page has finished loading
- `metaframe.ready` -> `metaframe.connected()`
- `metaframe` uses an enum for loading states


## [<=0.5.2] - 2021-04-14
### Added
- Changed npm package name: `metapage` and `metaframe` unified to `@metapages/metapage`
  - This means both the metaframe and metapage import the same root package
- Used `cloudseed` (does not yet have a public repo) infrastructure for build/test/publish/dev
