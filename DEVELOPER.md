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
just libs dev
```

### Host Setup

**Host requirements:**

- [deno](https://docs.deno.com/runtime/getting_started/installation/)
- [just](https://github.com/casey/just)
- [mkcert](https://github.com/FiloSottile/mkcert)
