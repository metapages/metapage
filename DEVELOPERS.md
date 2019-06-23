# Developers

The final products of this repository are:

1. javascript libraries for running metapages, which are websites that run networks of connected websites
    1. [metapage](https://www.npmjs.com/package/metapage)
    2. [metaframe](https://www.npmjs.com/package/metaframe)
2. [documentation](https://metapages.org/documentation/) with running, interactive examples.

## 1) Javascript Libraries

### Setup

**Install required:** 

- [docker + docker-compose](https://docs.docker.com/compose/install/)

**Install recommended:** 

- [just](https://github.com/casey/just)
- 
**Install optional (advanced):** 

These tools are only required if you are compiling code on your host machine (if you want to do this, you'll know how to setup) rather than use the pre-configured docker-compose stack that requires no local host installs (except docker) and possibly [just](https://github.com/casey/just) for the build commands.

- [haxe](https://haxe.org/download/) (or via homebrew: `brew install haxe`)
- [node.js](https://nodejs.org/en/download/) (or via homebrew: `brew install node`)

### Development loop

First
  
    `just run`  OR `docker-compose up jekyll proxy builder-haxe test`: starts the jekyll dev server

Then:

1. Edit haxe files, or documentation. Code and examples and documentation are all auto-compiled+reloaded. Source code in `./libs` is in the [Haxe](https://haxe.org/manual/target-javascript-getting-started.html) language).
   1. haxe code is compiled, if successful, packaged into local libraries for the local web server. The library versions are `latest`.
      1. `docs/js`: for local development
      2. `lib/build/npm`: for building the npm+browser libraries
   2. The jekyll server reloads any changed docs files
2. Comprehensive metapage test of the latest version: http://localhost:4000/tests/
3. Repeat

**Tips**:

toggle the `debug` flag in `libs/webpack.config.js`
toggle the `jsondiff` flag `libs/build-base.hxml`


If required, run the CI tests locally:

    make ci-local-test-google-cloud-build

### Deployment pipeline

1. On master branch: ```just version-new-publish```
2. Google Cloud Build ([./cloudbuild.yaml](./cloudbuild.yaml)) sees the npm version is new, so creates and publishes new npm packages via `make npm-publish`

## 2) Documentation

The docs and examples are static webpages built by jekyll and server via github pages:

https://help.github.com/articles/using-jekyll-as-a-static-site-generator-with-github-pages/
