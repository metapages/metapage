COMPOSE_DEV ?= DOCKER_REPOSITORY=${DOCKER_REPOSITORY} DOCKER_TAG=${DOCKER_TAG} docker-compose
NPM_MODE=development

.PHONY: help-dev
help-dev: help-impl-dev ## Development commands

.PHONY: run
run: ###dev Run a development stack, with autoreloading etc
	@#${COMPOSE_DEV} pull
	${COMPOSE_DEV} up jekyll

.PHONY: build
build: ###dev Build the (dev) libraries, ready for testing/playing
	webpack --mode=${NPM_MODE}


.PHONY: compile
compile: build ###dev Compile haxe->js
	# haxe build-metaframe.hxml
	# haxe build-metapage.hxml
	# webpack

.PHONY: clean
clean: ###dev Delete compiled files
	rm -rf build
	rm -rf ./docs/js/meta*

# .PHONY: clean-all
# clean-all: clean ###dev Clean all local files and compose stacks
# 	rm -rf .haxelib
# 	rm -rf node_modules
# 	${COMPOSE_DEV} down -v