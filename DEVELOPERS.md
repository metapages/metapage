<meta charset="utf-8">

# Developers

The final products of this repository are:

1. javascript libraries for running metapages, which are websites that run networks of connected websites
2. documentation with running, interactive examples.

## 1) Javascript Libraries

### Install (local machine)

These tools are only required if you are editing source code. 

- [haxe](https://haxe.org/download/) (or via homebrew: `brew install haxe`)
- [node.js](https://nodejs.org/en/download/) (or via homebrew: `brew install node`)
- [docker + docker-compose](https://docs.docker.com/compose/install/)

One time setup:

- npm -i
- npm -i --global webpack webpack-cli

### Development loop

1. `make run`: starts the jekyll dev server
2. Edit `./src` (source code is in the [Haxe](https://haxe.org/manual/target-javascript-getting-started.html) language)
3. Compile:
    ```
    webpack
    ```
4. Compiles js libraries are exported in two places:
    1. `docs/js`: for embedding directly in websites
    2. `build/npm`: for building the npm libraries
5. 

### Deployment pipeline

1. On master branch: ```npm version patch -m "Upgrade to %s for reasons"```
3. Google Cloud Build ([./cloudbuild.yaml](./cloudbuild.yaml)) sees the npm version is new, so creates new npm packages via `make npm-publish`
3. Compiles js libraries are exported in two places:
    1. `docs/js`: for embedding directly in websites
    2. `build/npm`: for building the npm libraries
4. 

## 2) Documentation

The docs and examples are static webpages built by jekyll and server via github pages:

https://help.github.com/articles/using-jekyll-as-a-static-site-generator-with-github-pages/



<!-- Markdeep: --><style class="fallback">body{visibility:hidden;white-space:pre;font-family:monospace}</style><script src="markdeep.min.js" charset="utf-8"></script><script src="https://casual-effects.com/markdeep/latest/markdeep.min.js" charset="utf-8"></script><script>window.alreadyProcessedMarkdeep||(document.body.style.visibility="visible")</script>