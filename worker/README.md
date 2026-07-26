# Worker

The metapage service at https://console.deno.com/metapage/npm — renders
metapages/metaframes, hosts the definition version-conversion API, and serves
the browser test suite.

Built with [Fresh 2](https://usefresh.dev) (Vite) on Deno, deployed with
`deno deploy`. The `deploy` block in `deno.json` names the org and app; Deno
Deploy uploads the source and runs `deno task build` itself.

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
- `/conversion` is deprecated -> `/convert`.
