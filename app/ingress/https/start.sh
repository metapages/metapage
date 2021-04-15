#!/usr/bin/env bash
set -e
# nginx doesn't so env vars so we use some basic templating from env vars
envsubst '$APP_FQDN $APP_PORT $TEST_SERVER_PORT' < /app/https/default.template.conf > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
