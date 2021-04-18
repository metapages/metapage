# Extra service-specific commands
set shell   := ["bash", "-c"]
# Avoid ../../../../foo type paths by hard-coding the repository root turning paths into e.g. /repo/cloud/foo
export ROOT := env_var_or_default("GITHUB_WORKSPACE", `git rev-parse --show-toplevel`)
just        := "just --justfile extra.justfile"

_help:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -f /.dockerenv ]; then
        echo -e "Extra project tools:"
        echo -e ""
        just --list --unsorted --justfile extra.justfile
        echo -e ""
    else
        just $ROOT/cloud/_docker
    fi

@console_set_up_oauth:
    PROJECT_ID=$(just ../project_id) ; \
    echo "↗ https://console.cloud.google.com/apis/credentials?orgonly=true&project=${PROJECT_ID}&supportedpurview=organizationId"

@_open_url url:
    if [[ "$OSTYPE" == "darwin"* ]];      then open {{url}}; \
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then xdg-open {{url}}; \
    else echo "OS unknown, cannot open browser"; \
    fi
