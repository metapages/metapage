# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
