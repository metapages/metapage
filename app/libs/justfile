###########################################################################
# Build the npm libraries: metapage, metaframe
###########################################################################
# just configuration
###########################################################################
set shell          := ["bash", "-c"]
set dotenv-load    := true
###########################################################################
# library configuration
###########################################################################
NPM_MODULE         := `cat package.json | jq -r .name`
NPM_TOKEN          := env_var_or_default("NPM_TOKEN", "")
tsc                := "./node_modules/typescript/bin/tsc"
vite               := "NODE_OPTIONS='--max_old_space_size=16384' ./node_modules/vite/bin/vite.js"
# minimal formatting, bold is very useful
bold               := '\033[1m'
normal             := '\033[0m'
green              := "\\e[32m"
yellow             := "\\e[33m"
blue               := "\\e[34m"
magenta            := "\\e[35m"
grey               := "\\e[90m"

_help:
    @just --list --unsorted --list-heading $'Commands:\n'

# Build the production npm distributions in dist/metaframe and dist/metapage
build: _build
_build: _ensure_node_modules _build_npm

_build_npm:
    #!/usr/bin/env bash
    set -euo pipefail
    # Compiles the entire codebase to typescript files in ./dist. Packaged into the npm module '{{NPM_MODULE}}'
    # How to test installation of the build?
    {{tsc}} --noEmit
    echo "✅ typescript check"
    {{vite}} build
    echo "✅ vite build"

# watch for file changes, then build ALL into ./dist
watch: _ensure_node_modules
    #!/usr/bin/env bash
    set -euo pipefail
    echo "👀 watching and building into ./dist..."
    {{tsc}} --noEmit
    echo "✅ typescript check"
    {{vite}} --watch build

@_tsc +args="":
    {{tsc}} {{args}}

# Run tests
test:
    just ../worker/test

# Develop:
#   1. just dev
#   2. modify metapage/metaframe code
#   3. refresh browser window
# recompile metapage/metaframe src on change, and open a browser at the test page for the local metapage test
dev: _ensure_node_modules watch

# typescript check 
@check: (_tsc "--build")
    echo -e "✅ {{green}}TypeScript{{normal}} check passed"

# npm link the package in dist for local development. In the other project: 'npm link @metapages/metapage'
@link:
    if [ ! -d dist ]; then just build; fi
    cd dist && npm link
    echo -e "👉 in the other project: npm link {{NPM_MODULE}}"

# unlink the package in dist from local development. You probably don't ever need to do this
@unlink:
    cd dist && npm unlink

# List all published versions
@list:
    npm view {{NPM_MODULE}} versions --json

# If the version does not exist, publish the packages (metaframe+metapage)
publish: _require_NPM_TOKEN _ensure_node_modules
    #!/usr/bin/env bash
    set -euo pipefail
    VERSION=`cat package.json | jq -r '.version'`
    # Check if the package exists, if not this is the first publish
    if ! npm view {{NPM_MODULE}} version &> /dev/null; then
        echo "📦 First time publishing {{NPM_MODULE}}"
    else
        INDEX=`npm view {{NPM_MODULE}} versions --json | jq "index( \"$VERSION\" )"`
        if [ "$INDEX" != "null" ]; then
            echo -e '🌳 Version exists, not publishing'
            exit 0
        fi
    fi
    just build
    echo "PUBLISHING npm version $VERSION"
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm publish --access public .
    # git tag $VERSION
    # git push origin $VERSION

# Unpublish version https://docs.npmjs.com/cli/v7/commands/npm-unpublish
unpublish version:
    @echo "❗ If this fails: you cannot use .npmrc or NPM_TOKEN, you must 'npm login' 🤷‍♀️"
    npm unpublish {{NPM_MODULE}}@{{version}}

# https://docs.npmjs.com/cli/v7/commands/npm-deprecate
module_deprecate version +message:
    npm deprecate {{NPM_MODULE}}@{{version}} "{{message}}"

# delete all generated assets/files
clean:
    @mkdir -p dist
    rm -rf dist/*
    just test/clean

@_require_NPM_TOKEN:
    if [ -z "$NPM_TOKEN" ]; then echo "Missing NPM_TOKEN"; exit 1; fi

@_ensure_node_modules:
    if [ ! -d node_modules ]; then npm i; fi
