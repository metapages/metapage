#Change the version then run `make tag`, this will trigger a build and publish
VERSION                    = 0.0.15
SHELL                      = /bin/bash
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
publish: test-ci publish-internal

# This expects NPM_TOKEN in the form: //registry.npmjs.org/:_authToken=XXX
# as this is what is directly dumped to the ~/.npmrc file (if it doesn't exist in that file)
.PHONY: publish-internal
publish-internal:
	@echo "PUBLISHING ${VERSION}"
	@if ! grep --no-messages -q "${NPM_TOKEN}" "${HOME}/.npmrc" ; \
		then echo "${NPM_TOKEN}" > ${HOME}/.npmrc ; \
	fi
	for name in "metaframe" "metapage" ; do \
		rm -rf ${BASE_DIST}/$${name} ; \
		mkdir -p ${BASE_DIST}/$${name} ; \
		cp docs/js/$${name}.js ${BASE_DIST}/$${name}/index.js ; \
		cat etc/npm/package.json | jq ". .version = \"${VERSION}\" | .name = \"$${name}\" | .main = \"$${name}.js\"" > ${BASE_DIST}/$${name}/package.json ; \
		pushd ${BASE_DIST}/$${name} ; \
		npm publish . || exit 1 ; \
		popd ; \
	done

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
