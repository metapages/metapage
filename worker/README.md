# Worker

The metapage service at https://console.deno.com/metapage/npm — renders
metapages/metaframes, hosts the definition version-conversion API, and serves
the browser test suite.

Built with [Fresh 2](https://usefresh.dev) (Vite) on Deno, deployed with
`deno deploy`. The `deploy` block in `deno.json` names the org and app and
spells out the install/build commands and the entrypoint; Deno Deploy uploads
the source and runs the build itself. Those fields override whatever the Deploy
console has stored for the app, so the build is defined here rather than in a
web form.

## Development

```sh
just dev      # Vite dev server with HMR (http, see the note in vite.config.ts)
just build    # production build into _fresh/
just preview  # serve the production build locally
just test     # browser test suite (astral) against the production build over https
just deploy   # build, then deno deploy --prod
```

## Dev notes

- The definition conversion routes import `@metapages/metapage` from npm rather
  than the sibling `../lib` source: Deno Deploy builds from the uploaded source
  tree, which cannot reach outside this directory. The version is pinned by
  `deno.lock`, so picking up a newly published lib means re-running
  `deno install` and committing the updated lock.
- `/conversion` is deprecated -> `/convert`, but still served: `routes/conversion`
  re-exports the `routes/convert` handlers so old links and API callers keep
  working.
- `static/` must stay out of the top-level `deno.json` `exclude` — that list
  also narrows what `deno deploy` uploads, and `/m`, `/mf` and the test-script
  routes read their sources from `static/` at request time.
