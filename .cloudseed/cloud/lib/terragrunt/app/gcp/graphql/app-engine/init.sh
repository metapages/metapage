#!/usr/bin/env bash
set -e
SECRETS=secrets.encrypted.json
# create an admin secret (if it doesn't exist) and encrypt it
if [ ! -f $SECRETS ]; then
    PASSWORD=$(date +%s | sha256sum | base64 | head -c 24)
    echo "{\"hasura_graphql_admin_secret\":\"$PASSWORD\"}" > $SECRETS
    just ../provider encrypt $PWD/$SECRETS
fi
