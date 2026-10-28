# [Metapages](https://metapage.io/)

- Render, tests, and tools: [module.metapage.io](https://module.metapage.io/)
- Docs: [docs.metapage.io/](https://docs.metapage.io/)

A **metapage** is a webpage that consists of a network of other embedded webpages. This repository contains the code for the core metapage module.

NPM: https://www.npmjs.com/package/@metapages/metapage

## Development

All commands use [just](https://github.com/casey/just) to run the commands.

To run the development stack:

```bash
just worker dev
```

To have the module automatically update when it changes:

```bash
just lib dev
```

## Releasing

The git tag is the release. One command, from a clean `main`:

```bash
just release          # next patch version
just release 1.11.0   # that exact version
```

It bumps `lib/package.json`, points the README's jsDelivr URLs at the new
version, moves the changelog's `[Unreleased]` section under the new version
number, commits, creates an annotated `vX.Y.Z` tag and pushes both. It refuses
to run from another branch, on a dirty tree, when `main` and `origin/main`
disagree, or when the version is already tagged or already on npm.

Pushing the tag runs
[`.github/workflows/publish.yml`](.github/workflows/publish.yml), which is the
only thing that publishes:

1. **Test** (self-hosted) — `just lib/fmt-check`, `just check`, `just test`.
   Tag pushes don't match `test.yml`/`format.yml`, so this is the gate.
2. **Publish** — asserts the tag and `lib/package.json` agree, then
   `just lib/publish`: build, jsDelivr bundle verification, and
   `npm publish --provenance` via npm [Trusted
   Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no token).
   Then it confirms the version is really on the registry and that the
   provenance attestation verifies.
3. **Release** — creates the GitHub release from the changelog section for that
   version, with the published tarball attached.

Nothing in the workflow mutates the repo, so every step is idempotent: if a
release fails halfway, **re-run the workflow run** from the Actions tab rather
than cutting a new tag.

Two things to know before changing any of this:

- **Don't rename `publish.yml`.** npm Trusted Publishing is configured on
  npmjs.com against this repository *and* this workflow filename; renaming it
  breaks the OIDC exchange and the publish loses its right to the registry.
- The worker deploys separately and continuously, from every push to `main`
  ([`deploy.yml`](.github/workflows/deploy.yml)). It is not tied to npm
  versions.

### Host Setup

**Host requirements:**

- [deno](https://docs.deno.com/runtime/getting_started/installation/)
- [just](https://github.com/casey/just)
- [mkcert](https://github.com/FiloSottile/mkcert)
