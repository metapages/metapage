COMPOSE_DEV ?= DOCKER_REPOSITORY=${DOCKER_REPOSITORY} DOCKER_TAG=${DOCKER_TAG} docker-compose
NPM_MODE    ?= production

.PHONY: help-dev
help-dev: help-impl-dev ## Development commands

.PHONY: run
run: ###dev Run a development stack, with autoreloading etc
	${COMPOSE_DEV} pull
	${COMPOSE_DEV} up --build jekyll

.PHONY: run-no-build
run-no-build: ###dev Run a development stack, with autoreloading etc
	${COMPOSE_DEV} up jekyll


.PHONY: stop
stop: ###dev Stop a development stack
	${COMPOSE_DEV} down -v

.PHONY: compile
compile: set-context ###dev Build the libraries, ready for testing/playing/packaging
	webpack --mode=${NPM_MODE}

# Don't build before this command, too many places don't want to auto-build
.PHONY: test
test: ###dev Build the libraries, ready for testing/playing/packaging
	node test/test.js

.PHONY: clean
clean: ###dev Delete compiled files
	rm -rf build
	rm -rf ./docs/js/meta*

# shell into the test container, will likely have linked services
.PHONY: ci-test-shell
ci-test-shell:
	${COMPOSE_CI} run --rm \
		-e "PS1=\[\033[01;34m\]docker-${PROJECT_NAME} [\W]\[\033[00m\]$$ " \
		test /bin/sh

.PHONY: set-context-host
set-context-host: ###dev This must be run OUTSIDE a container
	@if [ -f /.dockerenv ]; then \
		echo "This must be run outside a docker container (on the host)"; \
		exit 1; \
	fi
	@echo "Context: host"
	mkdir -p ../../mps_node_modules
	mkdir -p ../../mps_haxelib
	rm -rf node_modules
	rm -rf .haxelib
	ln -s ../../mps_node_modules node_modules
	ln -s ../../mps_haxelib .haxelib

# container libraries are installed in the root so that mounting
# in the project root does not hide the previously installed libs
.PHONY: set-context-container
set-context-container: ###dev This must be run INSIDE a container
	@if [ ! -f /.dockerenv ]; then \
		echo "This must be run inside a docker container"; \
		exit 1; \
	fi
	@echo "Context: container"
	rm -rf node_modules
	rm -rf .haxelib
	ln -s /node_modules node_modules
	ln -s /.haxelib .haxelib

.PHONY: set-context
set-context: ###dev This must be run INSIDE a container
	@if [ -f /.dockerenv ]; then \
		${MAKE} set-context-container; \
	else \
		${MAKE} set-context-host; \
	fi
