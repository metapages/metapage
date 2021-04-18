# Extra service-specific commands
set shell := ["bash", "-c"]
just := "just --justfile extra.justfile"
bold          := '\033[1m'
normal        := '\033[0m'

_help:
    #!/usr/bin/env bash
    set -euo pipefail
    echo -e "Extra project tools:"
    echo -e ""
    {{just}} --list --unsorted
    echo -e ""

# Open the hasura graphql database console. Host only (cannot be run in the docker environment)
@console:
    hasura_graphql_admin_secret=$(just ../provider decrypt $PWD/secrets.encrypted.json | jq -r .hasura_graphql_admin_secret ) && \
    hasura_endpoint=$(just output | jq -r .url) && \
    echo -e "" ; \
    echo -e "Run these commands on your host (not inside the docker container, since your host browser cannot reach it:" ; \
    echo -e "" ; \
    echo -e "    {{bold}}cd <repo root host>/app/graphql{{normal}}"
    echo -e "    {{bold}}hasura --skip-update-check console --console-port 9695 --no-browser --address 0.0.0.0 --endpoint ${hasura_endpoint} --admin-secret ${hasura_graphql_admin_secret}{{normal}}"
    echo -e ""
