# just docs: https://github.com/casey/just

# Very high-level root-repository operations
# More specific commands are in deeper justfiles
#  - Commands containing 🌱 in the docs are (or will be) used for automation and are required to link to docs explaining further if needed

set shell       := ["bash", "-c"]
set dotenv-load := true
# TODO: bold doesn't work, and it used to. What happened?
bold               := '\033[1m'
normal             := '\033[0m'
green              := "\\e[32m"
yellow             := "\\e[33m"
blue               := "\\e[34m"
magenta            := "\\e[35m"
grey               := "\\e[90m"

_help:
    #!/usr/bin/env bash
    just --list --unsorted --list-heading $'🚪 Commands for {{green}}https://github.com/metapages/metapage{{normal}}:\n\n'
    echo -e ""
    echo -e "       🔽 {{bold}}Sub-commands: ( just <command> ){{normal}}"
    echo -e "           worker {{blue}}#worker commands{{normal}}"
    echo -e "           lib    {{blue}}#library(module) commands{{normal}}"

# Build the application stack
@build +args="":
    # The worker builds the js module too
    just worker/build

# Run all build/unit/functional tests
test:
    just lib/test
    just worker/test

# Publish new npm module version (defined in lib/package.json)
publish:
    just lib/publish
    just worker/deploy

# Run the worker
@dev:
    just worker/dev

# Quick compile check
@check:
    just lib/check
    just worker/check

@fmt +failIfChanged="":
    just lib/fmt {{failIfChanged}}

# Deletes generated files
@clean:
    just lib/clean
    just worker/clean

###################################################
# Internal utilies
###################################################

alias worker := _worker
@_worker +args="":
    just worker/{{args}}

alias lib := _lib
@_lib +args="":
    just lib/{{args}}