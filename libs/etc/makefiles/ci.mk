##################################################################
# This makefile is updated from github. Please do not edit directy.
# See https://github.com/dionjwa/makefiles
##################################################################

SHELL                        = /bin/bash

BLUE	                    := \033[0;34m
GREEN	                    := \033[0;32m
RED                         := \033[0;31m
NC                          := \033[0m

HELP_OVERVIEW_FILE          ?= HELP.md

.PHONY: help
# Adapted from  https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## Help documentation (default)
	@grep -h -E '^[a-zA-Z_-]+[a-zA-Z0-9_-]*:.*? ## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-40s\033[0m %s\n", $$1, $$2}'
	@ if [ -f "${HELP_OVERVIEW_FILE}" ]; then \
		cat "${HELP_OVERVIEW_FILE}" ; \
	fi

.PHONY: help-%
help-impl-%:
	@grep -h -E '^[a-zA-Z_-]+[a-zA-Z0-9_-]*:.*? ###?$* .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*? ###$* "}; {printf "\033[36m%-40s\033[0m %s\n", $$1, $$2}'

.PHONY: help-all
help-all: ## All help documentation
	@grep -h -E '^[a-zA-Z_-]+[a-zA-Z0-9_-]*:.*? ##.* .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?#+[a-z]* "}; {printf "\033[36m%-40s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

##################################################################
# Utility commands required by many commands
##################################################################

# Ensure specific env vars are set for specific commands
guard-env-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

##################################################################
# Continuous integration tools
##################################################################

# Assumes all build/test/push tests can be peformed via docker-compose
#
# Assumptions:
#  - the project name is the parent folder name
#  - there is a single container in a docker-compose stack that will run/coordinate all required tests
#  - the final docker image is named <project name>.<git sha>
#  - tests are run via docker-compose services starting with "test"
#  - you pass in the DOCKER_REGISTRY env var all the time. Why?
#     - it's dumb: docker-compose later caching is all kinds of busted
#     - so to get it working, images must be labelled with the full registry name
#     - yeah it sucks, but at least this way it works.
#
# Benefits:
#  - organized docker build caching. this is not free when using multi-stage docker builds
#  - a single makefile to perform all build/test/push steps.
#  - works on any CI/CD pipeline as only docker-compose is required

# These commands should 1:1 map to e.g. google cloud build
# Keep it simple, just use docker-compose for everything

PROJECT_NAME              ?= $(shell basename ${PWD})
# If the default values are modified, also change ${COMPOSE_CI_FILE}
DOCKER_REPOSITORY         ?= ${DOCKER_REGISTRY}/${PROJECT_NAME}

# Then just compute the git tag
# https://stackoverflow.com/questions/21017300/git-command-to-get-head-sha1-with-dirty-suffix-if-workspace-is-not-clean
DOCKER_TAG                ?= $(shell git describe --match=NeVeRmAtCh --always --abbrev=40 --dirty)

# Prepend env vars to compose commands
COMPOSE_CI_ENV            ?=

COMPOSE_CI_FILE           ?= docker-compose.yml
COMPOSE_CI                ?= ${COMPOSE_CI_ENV} DOCKER_REPOSITORY=${DOCKER_REPOSITORY} DOCKER_TAG=${DOCKER_TAG} docker-compose -f ${COMPOSE_CI_FILE}

# Run before beginning tests. Allows user override.
COMPOSE_TEST_PREPARE      ?= echo "Running tests"

# Run before the main build step. Allows user override.
COMPOSE_BUILD_PREPARE     ?= echo "Building tests"

# Push only the builder image(s)
COMPOSE_PUSH_BUILDER      ?=
# Push only the final artifact(s)
COMPOSE_PUSH_ARTIFACT     ?=

.PHONY: help-ci
help-ci: help-impl-ci ## CI/CD commands

.PHONY: ci-pull
ci-pull: guard-env-DOCKER_REGISTRY ###ci CI: pull images for caching
	${COMPOSE_CI} pull --ignore-pull-failures

.PHONY: ci-build
ci-build: ci-pull ci-build-no-pull guard-env-DOCKER_REGISTRY ###ci CI: build the final docker image

.PHONY: ci-build-no-pull
ci-build-no-pull: guard-env-DOCKER_REGISTRY
	${COMPOSE_BUILD_PREPARE}
	${COMPOSE_CI} build

# Iterate through all compose services starting with "test"
# For each, run a separate compose test check
# #TODO: docker-compose does not always correctly report the exit code from failed compose runs ;\
# ${COMPOSE_CI} ps | grep '_${COMPOSE_TEST_SERVICE}_1 .*Exit 0' >/dev/null 2>&1 ;\
.PHONY: ci-test
ci-test: ci-build ci-test-no-build guard-env-DOCKER_REGISTRY ###ci CI: test in docker-compose. Run `make ci-test-no-build` to skip the build step.

.PHONY: ci-test-no-build
ci-test-no-build: guard-env-DOCKER_REGISTRY
	${COMPOSE_TEST_PREPARE}
	@# Cycle through all test services one at a time
	@grep "^  test[a-zA-Z0-9_.-]*:" ${COMPOSE_CI_FILE} | while read -r line ; do \
		export COMPOSE_TEST_SERVICE=$$(cut -d':' -f1 <<<"$${line}") ; \
		echo "${COMPOSE_CI} up --abort-on-container-exit --remove-orphans --exit-code-from $${COMPOSE_TEST_SERVICE} $${COMPOSE_TEST_SERVICE}" ; \
		${COMPOSE_CI} up --abort-on-container-exit --remove-orphans --exit-code-from $${COMPOSE_TEST_SERVICE} $${COMPOSE_TEST_SERVICE} ; \
	done

.PHONY: ci-push-builder
ci-push-builder: guard-env-DOCKER_REGISTRY guard-env-COMPOSE_PUSH_BUILDER ###ci CI: push the intermediate builder images for faster future builds. Defaults to all images
	${COMPOSE_CI} push ${COMPOSE_PUSH_BUILDER}

.PHONY: ci-push-artifact
ci-push-artifact: guard-env-DOCKER_REGISTRY guard-env-COMPOSE_PUSH_ARTIFACT ###ci CI: push the final docker image(s)
	${COMPOSE_CI} push ${COMPOSE_PUSH_ARTIFACT}

.PHONY: ci-push
ci-push: guard-env-DOCKER_REGISTRY ###ci CI: push all docker images
	${COMPOSE_CI} push

.PHONY: ci-down
ci-down: guard-env-DOCKER_REGISTRY ###ci CI: bring all services down
	${COMPOSE_CI} down --remove-orphans --volumes

.PHONY: ci-up
ci-up: guard-env-DOCKER_REGISTRY ###ci CI: bring all services down
	${COMPOSE_CI} up

BRANCH_NAME ?= not-master
.PHONY: ci-local-test-google-cloud-build
ci-local-test-google-cloud-build: ci-down ###ci CI: run GCE cloud build locally
	cloud-build-local --dryrun=false --substitutions REPO_NAME=${PROJECT_NAME},COMMIT_SHA=${DOCKER_TAG},BRANCH_NAME=${BRANCH_NAME} .

##################################################################
# Continuous integration docker image
##################################################################
#
# These tools allow running a bash shell with all tools installed
# for compiling, running, and testing your project.
# Assumptions:
#  - there is a "builder" docker image that can build all artifacts and tests
#  - the "builder" image is built from a docker-compose file: image layer caching
#    doesn't always work between docker-compose and docker, due to https://github.com/docker/compose/issues/883
#    so we must build everything via docker-compose (this seems not much of a burden)
#
# Recommendations:
#  - the "builder" image is part of a multi-stage Dockerfile, named "builder"

# The builder image is simply the final docker image name but with the tag: builder
# Typically this should not be changed.
BUILDER_DOCKER_IMAGE ?= ${DOCKER_REGISTRY}/${PROJECT_NAME}:builder

BUILDER_SHELL_PARAMS      ?= -e HIST_FILE=/root/.bash_history -v ${HOME}/.bash_history:/root/.bash_history
BUILDER_SHELL_PWD_MOUNT   ?= /workspace
BUILDER_SHELL_WORKING_DIR ?= /workspace
BUILDER_SHELL_SHELL       ?= /bin/bash

# Mount docker first
.PHONY: ci-shell
ci-shell: ci-pull ci-build ci-shell-no-build ###ci BUILD: create a shell inside a docker container will ALL required build tools, and local project mounted. Not host installs required.

# ci-shell but without the build step
.PHONY: ci-shell-no-build
ci-shell-no-build:
	@docker run --rm -ti \
		-v ${PWD}:${BUILDER_SHELL_PWD_MOUNT}:cached \
		-w ${BUILDER_SHELL_WORKING_DIR} \
		-v /var/run/docker.sock:/var/run/docker.sock \
		${BUILDER_SHELL_PARAMS} \
		-e "PS1=\[\033[01;34m\]docker-${PROJECT_NAME} [\W]\[\033[00m\]$$ " \
		${BUILDER_DOCKER_IMAGE} ${BUILDER_SHELL_SHELL}


ci-shell-%: ###ci BUILD: Convenience command: run the % make command in the builder environment
	@docker run --rm -ti \
		-v ${PWD}:${BUILDER_SHELL_PWD_MOUNT}:cached \
		-w ${BUILDER_SHELL_WORKING_DIR} \
		-v /var/run/docker.sock:/var/run/docker.sock \
		${BUILDER_SHELL_PARAMS} \
		${BUILDER_DOCKER_IMAGE} make $*

##################################################################
# Update this makefile from github
##################################################################

# Generate the single make file
# Shared makefiles can replace themselves from github.
# Therefore, it needs its own file system path.
DIR_CURRENT             := $(notdir $(patsubst %/,%,$(dir $(MAKEFILE_PATH))))
MAKEFILE_GITHUB_BRANCH  ?= master
MAKEFILE_PATH           := $(abspath $(lastword $(MAKEFILE_LIST)))
MAKEFILE_UPDATE_TARGET  ?= ${MAKEFILE_PATH}

.PHONY: help-mk
help-mk: help-impl-mk ## Makefile update commands

# Update this makefile with the latest from the github repo.
# Requires a github token and the github username
# By using a single combined makefile, this is easier than
# maintaining a github submodule
.PHONY: makefile-update-from-github
makefile-update-from-github: guard-env-MAKEFILE_GITHUB_USER guard-env-MAKEFILE_GITHUB_TOKEN ###mk Replace this makefile with the latest from master
	curl --fail --silent \
	--header 'Authorization: token ${MAKEFILE_GITHUB_TOKEN}' \
     	--header 'Accept: application/vnd.github.v3.raw' \
     	--output ${MAKEFILE_UPDATE_TARGET} \
     	--location "https://api.github.com/repos/${MAKEFILE_GITHUB_USER}/makefiles/contents/etc/makefiles/ci.mk?ref=${MAKEFILE_GITHUB_BRANCH}"

.PHONY: makefile-update-from-docker-image
makefile-update-from-docker-image: ###mk Replace this makefile with the latest docker image artifact
	docker pull gcr.io/t9-docker-images/makefiles:latest
	docker run --rm -v ${PWD}:/workspace gcr.io/t9-docker-images/makefiles:latest sh -c 'mkdir -p ./etc/makefiles && cp /etc/makefiles/ci.mk ./etc/makefiles/'

