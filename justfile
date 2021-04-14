# just docs: https://github.com/casey/just

# Very high-level root-repository operations
# More specific commands are in deeper justfiles
#  - Commands containing 🌱 in the docs are (or will be) used for automation and are required to link to docs explaining further if needed

set shell := ["bash", "-c"]

# Temporarily disabled attempting to automatically jump into docker for the ci ops, since they
# rely on building docker images, and mounting host directories is rife with permissions problems:
# https://github.com/moby/moby/issues/2259#issuecomment-48284631
_help:
    #!/usr/bin/env bash
    #if [ -f /.dockerenv ]; then
        echo ""
        echo "🌱 Cloudseed 🌱 gitops powered application framework"
        echo ""
        just --list --unsorted --list-heading $'Commands:\n'
        echo -e ""
        echo -e "    🔽 Sub-commands:"
        echo -e "    app"
        echo -e "    ci"
        echo -e ""
    #else
    #    just ci/_docker .;
    #fi

# builds (versioned) production docker images
@build:
    just ci/build

# Run all build/unit tests
@test:
    just ci/test

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
