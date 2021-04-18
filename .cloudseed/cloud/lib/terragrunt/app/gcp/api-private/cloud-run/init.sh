#!/usr/bin/env bash
set -e
SECRETS=secrets.encrypted.json
# create an API key (if it doesn't exist) and encrypt it
if [ ! -f $SECRETS ]; then
    PASSWORD=$(date +%s | sha256sum | base64 | head -c 24)
    echo "{\"key\":\"$PASSWORD\"}" > $SECRETS
    just ../provider encrypt $PWD/$SECRETS
fi
