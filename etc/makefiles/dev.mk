COMPOSE_DEV ?= DOCKER_REPOSITORY=${DOCKER_REPOSITORY} DOCKER_TAG=${DOCKER_TAG} docker-compose

.PHONY: help-dev
help-dev: help-impl-dev ## Development commands

.PHONY: run
run: ###dev Run a development stack, with autoreloading etc
	@#${COMPOSE_DEV} pull
	${COMPOSE_DEV} up jekyll

.PHONY: clean
clean: ###dev Clean all local files and compose stacks
	rm -rf .haxelib
	rm -rf node_modules
	rm -rf build
	rm -rf ./docs/js/meta*
	${COMPOSE_DEV} down -v