# The dash prepended to the "include" command prevents make from exiting if the file does not exist
-include .env

COMPOSE_CI_FILE       = docker-compose.yml
COMPOSE_PUSH_BUILDER  = builder jekyll
# COMPOSE_BUILD_PREPARE ensures that code is built before jekyll image is built
# COMPOSE_BUILD_PREPARE = ${MAKE} compile

# No make commands are defined in the base Makefile to ensure it is generic/not project specific
include etc/makefiles/*.mk
