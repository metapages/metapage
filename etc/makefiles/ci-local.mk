COMPOSE_DEV ?= DOCKER_REPOSITORY=${DOCKER_REPOSITORY} DOCKER_TAG=${DOCKER_TAG} docker-compose
NPM_MODE    ?= production

.PHONY: help-dev
help-dev: help-impl-dev ## Development commands

.PHONY: compile
compile: ###dev Build the libraries, ready for testing/playing/packaging
	${COMPOSE_DEV} run builder-haxe make compile

.PHONY: run
run: ###dev Run a development stack, with autoreloading etc
	${COMPOSE_DEV} pull
	${COMPOSE_DEV} up --build jekyll

.PHONY: run-no-build
run-no-build: ###dev Run a development stack, with autoreloading etc
	${COMPOSE_DEV} up jekyll


# .PHONY: stop
# stop: ###dev Stop a development stack
# 	${COMPOSE_DEV} down -v


# # Don't build before this command, too many places don't want to auto-build
# .PHONY: test
# test: ###dev Build the libraries, ready for testing/playing/packaging
# 	node test/test.js

# .PHONY: clean
# clean: ###dev Delete compiled files
# 	rm -rf build
# 	rm -rf ./docs/js/meta*

# # shell into the test container, will likely have linked services
# .PHONY: ci-test-shell
# ci-test-shell:
# 	${COMPOSE_CI} run --rm \
# 		-e "PS1=\[\033[01;34m\]docker-${PROJECT_NAME} [\W]\[\033[00m\]$$ " \
# 		test /bin/sh

