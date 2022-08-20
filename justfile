# just docs: https://github.com/casey/just

# Very high-level root-repository operations
# More specific commands are in deeper justfiles
#  - Commands containing 🌱 in the docs are (or will be) used for automation and are required to link to docs explaining further if needed

set shell       := ["bash", "-c"]
set dotenv-load := true
# TODO: bold doesn't work, and it used to. What happened?
bold            := '\033[1m'
normal          := '\033[0m'
blue            := '\033[0;34m'

# Temporarily disabled attempting to automatically jump into docker for the ci ops, since they
# rely on building docker images, and mounting host directories is rife with permissions problems:
# https://github.com/moby/moby/issues/2259#issuecomment-48284631
_help:
    #!/usr/bin/env bash
    #if [ -f /.dockerenv ]; then
        echo -e ""
        echo -e "🌱 Cloudseed 🌱 gitops powered application delivery framework"
        echo -e ""
        just --list --unsorted --list-heading $'🚪 Commands root level: (simple, reliable, probably slow)\n\n'
        echo -e ""
        echo -e "    🔽 {{bold}}Sub-commands:{{normal}}"
        echo -e "    app  {{blue}}# docs and libs developing and publishing{{normal}}"
        echo -e "    ci   {{blue}}# CI versions of build/test/deploy{{normal}}"
        echo -e ""
    #else
    #    just ci/_docker .;
    #fi

# builds (versioned) production docker images
@build:
    just ci/build

# Run all build/unit tests
@test:
    just app/test

# Publish new npm modules and associated documentation
@publish:
    DOCKER_COMPOSE="docker-compose -f docker-compose.yml" just app/publish

# Develop: run the stack with docker-compose, open a browser window. 'just app/down' to stop.
@dev:
    just app/dev

###################################################
# Internal utilies
###################################################

# sdfsf
alias ci := _ci
@_ci +args="":
    just ci/{{args}}

alias app := _app
@_app +args="":
    just app/{{args}}

_ensure_inside_docker:
    #!/usr/bin/env bash
    if [ ! -f /.dockerenv ]; then
        echo -e "🌵🔥🌵🔥🌵🔥🌵 First run the command: just 🌵🔥🌵🔥🌵🔥🌵"
        exit 1
    fi
