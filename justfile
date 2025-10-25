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
    echo -e "           app    {{blue}}#lib and worker commands{{normal}}"
    echo -e "           worker {{blue}}#worker commands{{normal}}"
    echo -e "           lib    {{blue}}#library(module) commands{{normal}}"
    echo -e ""

# Run all build/unit tests
@test:
    just app/test

# Publish new npm modules and associated documentation
@publish:
    DOCKER_COMPOSE="docker compose -f docker-compose.yml" just app/publish

# Develop: run the stack with docker-compose, open a browser window. 'just app/down' to stop.
@dev:
    just app/dev

# Quick compile check
@check:
    just app/check

@fmt +failIfChanged="":
    just app/fmt {{failIfChanged}}

###################################################
# Internal utilies
###################################################

alias app := _app
@_app +args="":
    just app/{{args}}

alias worker := _worker
@_worker +args="":
    just app/worker/{{args}}

alias libs := _libs
@_libs +args="":
    just app/libs/{{args}}