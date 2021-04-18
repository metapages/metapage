# Unified deployment component justfile
# Minimum terraform/terragrunt apply/destroy/output commands
set shell                             := ["bash", "-c"]
# Avoid ../../../../foo type paths by hard-coding the repository root turning paths into e.g. /repo/cloud/foo
export ROOT                           := env_var_or_default("GITHUB_WORKSPACE", "/repo")
# GOOGLE_APPLICATION_CREDENTIALS is a standard env var: https://cloud.google.com/docs/authentication/production
export GOOGLE_APPLICATION_CREDENTIALS := ROOT + "/cloud/.provider/gcp/terraform-admin.json"
# GOOGLE_ORGANIZATION_JSON is not used outside of cloudseed
export GOOGLE_ORGANIZATION_JSON       := ROOT + "/cloud/.provider/gcp/organization.encrypted.json"
# git sha (length 8 by default)
export VERSION                        := `just ../ci version`
export FQDN                           := `basename $(dirname $(dirname $PWD))`
pwd                                   := env_var("PWD")
root                                  := "<${PWD}/>"
bold                                  := '\033[1m'
normal                                := '\033[0m'
green                                 := "\\e[32m"
yellow                                := "\\e[33m"
magenta_light                         := "\\e[92m"

# If not in docker, get inside
_help:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -f /.dockerenv ]; then
        echo -e "🌱 Cloudseed 🌱"
        echo -e "   {{bold}}$(basename $PWD){{normal}} 🚀 deployment @ ${FQDN}"
        echo -e ""
        just --list --unsorted --list-heading $'Commands: (all services)\n'
        echo -e ""
        if [ -f 'extra.justfile' ]; then
            just -f extra.justfile --list --unsorted --list-heading $"" --list-prefix '    '
        fi
        echo -e ""
        echo -e "    Useful commands:"
        echo -e "      build, push, and deploy an image with a custom tag:    {{bold}}DOCKER_TAG=test just image_push && just apply{{normal}}"
        echo -e ""

    else
        just $ROOT/cloud/_docker
    fi

# Idempotent. Custom (if it exists) initialization. Terragrunt handles its own init
@init:
    if [ -f init.sh ]; then ./init.sh; fi

# 🌱 requires init once. deploy the application (or target child resource) at @ gcp (Google Compute Engine). Build images then update terraform configs
@apply *args="--terragrunt-non-interactive -auto-approve": _ensure_image (_apply args)

# apply, but without any required steps, good for development
@_apply *args="--terragrunt-non-interactive -auto-approve":
    echo -e "🚪 <${PWD}/> {{bold}}terragrunt apply {{args}} {{normal}}🚪 "; \
    terragrunt apply {{args}}

# terragrunt/terraform plan
@plan:
    echo -e "🚪 <${PWD}/> {{bold}}terragrunt plan {{normal}}🚪 "; \
    terragrunt plan

@destroy *args="--terragrunt-non-interactive":
    echo -e "🚪 <${PWD}/> {{bold}}terragrunt destroy {{args}} {{normal}}🚪 "; \
    terragrunt destroy {{args}}

# 🌱 simplified terraform outputs (minimal output keys=>values)
@output: (_provider "activate_service_account")
    terragrunt output -json | jq 'to_entries | map( {(.key): .value.value } ) | add'

# terragrunt but with cloudseed env vars (use this instead of naked terragrunt, some env vars might be missing)
@terragrunt *args="":
    terragrunt {{args}}

alias t:= terragrunt

# The full docker image URL: <registry>/<tag>:<sha>
@image:
    just ../ci full_image_url $(basename $PWD) $(just ../_docker_registry)

@image_push:
    just ../push_images $(basename $PWD)

# Delete local terragrunt cache. Does not touch cloud resources.
clean:
    rm -rf .terragrunt-cache

# Re-creates all resource config symlinks. Non-destructive. For development or library/tooling updates
update_configuration:
    #!/usr/bin/env bash
    RESOURCE=$(basename $PWD)
    TYPE=$(just _service_type)
    DOMAIN=$(basename $(dirname $(dirname $PWD)))
    echo -e "🚪 {{bold}}just $ROOT/cloud/create gcp --${RESOURCE}=${TYPE} --update=${RESOURCE} ${DOMAIN} {{normal}}🚪"
    just $ROOT/cloud/create gcp --${RESOURCE}=${TYPE} --update=${RESOURCE} ${DOMAIN}

# Fast development iteration: 1) git commit 2) deploy updated (versioned) resource
develop:
    cd $ROOT ; git add -u ; git commit -m "WIP from $(basename $PWD)@$(basename $(dirname $(dirname $PWD)))" || true
    just apply

# the parameter used to create this service when created, defined in terragrunt.hcl. "cloud/lib/terraform/app/gcp/graphql//cloud-run" returns "cloud-run"
@_service_type:
    cat terragrunt.hcl | grep "source = " | cut -d'/' -f9 | cut -d'"' -f0

_ensure_image:
    #!/usr/bin/env bash
    set -euo pipefail
    # Exit safely if this resource does not consume a docker image
    if [ $(just $ROOT/app/images json | jq -r ". | index(\"$(basename $PWD)\")") == "null" ]; then exit 0; fi
    IMAGE=$(just image)
    echo "$IMAGE"
    if [[ "$(docker image inspect $IMAGE 2> /dev/null | jq '. | length' )" == "0" ]]; then
        echo "$IMAGE doesn't exist, building and pushing"
        just image_push
    fi

# alias to gcp provider commands (status, initialization, etc)
@_provider +args="":
    just $ROOT/.cloudseed/cloud/lib/provider/gcp/{{args}}
