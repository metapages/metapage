
#Change the version then run `make tag`, this will trigger a build and publish
GIT_REPO                   = dionjwa/metapage
BASE_DIST                  = dist/npm
DOCKER_COMPOSE             = docker-compose
DOCKER_COMPOSE_TOOLS       = docker-compose -f docker-compose.tools.yml

SHELL=/bin/bash
COMPOSE_TOOLS=docker-compose -f docker-compose-tools.yml run

.PHONY: start
start: install compile

.PHONY: travis
travis:
	@if [ "${TRAVIS_BRANCH}" == "master" ] && [ "${TRAVIS_PULL_REQUEST}" != "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ]; \
		then make test-ci ; \
	fi
	@if [ "${TRAVIS_PULL_REQUEST}" == "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ] && [ "${VERSION}" == "${TRAVIS_TAG}" ] && [ ! -z "${NPM_TOKEN}" ]; \
		then make publish ; \
	fi

.PHONY: compile
compile:
	rm -rf docs/js/metapage*
	rm -rf docs/js/metaframe*
	${DOCKER_COMPOSE_TOOLS} run compile

.PHONY: haxelib
haxelib:
	${DOCKER_COMPOSE_TOOLS} run haxelibs

.PHONY: install
install: haxelib

.PHONY: test-ci
test-ci: install compile
	@echo 'Implement basic tests'

.PHONY: publish
publish: ci-test publish-internal

.PHONY: clean
clean:
	rm -rf .haxelib
	rm -rf ./docs/js/metaframe*
	rm -rf ./docs/js/metapage*

.PHONY: serve
serve: install compile
	cd docs && ${DOCKER_COMPOSE} up

.PHONY: tag
tag:
	sed -i '' "s#<script src=\"https://cdn.jsdelivr.net.*#<script src=\"https://cdn.jsdelivr.net/npm/metaframe@${VERSION}/index.js\"></script>#" docs/_includes/metaframe_lib_script.html
	echo "${VERSION}" > ./docs/_includes/version.html
	git tag "${VERSION}"
	git add -u
	git commit -m "Version update > ${VERSION}"
	git push
	git tag --delete "${VERSION}"
	git tag -f "${VERSION}"
	git push --tags
