# The dash prepended to the "include" command prevents make from exiting if the file does not exist
-include .env

PROJECT_NAME              = metapage
DOCKER_REGISTRY           = gcr.io/t9-docker-images
# DOCKER_REPOSITORY        ?= gcr.io/t9-docker-images/metapage

COMPOSE_CI_FILE           = docker-compose.yml
# Add any custom overrides here
# Name the sevices that are intermediate docker multi-stage builds
COMPOSE_PUSH_BUILDER      = builder test
# Name the compose service that is the final build image
COMPOSE_PUSH_ARTIFACT     = artifact artifact-latest

# No make commands are defined in the base Makefile to ensure it is generic/not project specific
include etc/makefiles/*.mk
