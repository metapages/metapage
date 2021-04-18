# Extra service-specific commands
set shell := ["bash", "-c"]
export ROOT := env_var_or_default("GITHUB_WORKSPACE", `git rev-parse --show-toplevel`)
DENO_SOURCE := ROOT + "/.cloudseed/deno"
just        := "just --justfile extra.justfile"
bold        := '\033[1m'
normal      := '\033[0m'

_help:
    #!/usr/bin/env bash
    set -euo pipefail
    echo -e "Extra project tools:"
    echo -e ""
    {{just}} --list --unsorted
    echo -e ""

# Open the gcp oauth app console
@console:
    deno run --unstable --allow-all {{DENO_SOURCE}}/exec/open_url.ts "https://console.cloud.google.com/apis/credentials?orgonly=true&project=$(just ../project_id)&supportedpurview=organizationId"

@ensure_oauth_credentials:
    deno run --unstable --allow-all {{DENO_SOURCE}}/cloudseed/gcp/gcloud_get_oauth_credentials.ts
