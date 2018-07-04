#Change the version then run `make tag`, this will trigger a build and publish
VERSION                    = 0.0.13
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
travis: install compile
	make travis-internal

.PHONY: travis-internal
travis-internal:
	@if [ "${TRAVIS_BRANCH}" == "master" ] && [ "${TRAVIS_PULL_REQUEST}" != "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ]; \
		then make test-ci ; \
	fi
	@if [ "${TRAVIS_PULL_REQUEST}" == "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ] && [ "${VERSION}" == "${TRAVIS_TAG}" ] && [ ! -z "${NPM_TOKEN}" ]; \
		then make publish-internal ; \
	fi

.PHONY: compile
compile:
	rm -rf docs/js/metapage*
	rm -rf docs/js/metaframe*
	${DOCKER_COMPOSE_TOOLS} run compile
	# sed -i '' "s#metapage_library_path: \"https://cdn.*#metapage_library_path: \"https://cdn.jsdelivr.net/npm/metapage@${VERSION}/index.js\"#g" docs/_data/urls-internal.yml
	# sed -i '' "s#metaframe_library_path: \"https://cdn.*#metaframe_library_path: \"https://cdn.jsdelivr.net/npm/metaframe@${VERSION}/index.js\"#g" docs/_data/urls-internal.yml

.PHONY: haxelib
haxelib:
	${DOCKER_COMPOSE_TOOLS} run haxelibs

.PHONY: install
install: haxelib

.PHONY: test-ci
test-ci:
	@echo 'Implement basic tests'

.PHONY: publish
publish: install compile publish-internal

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
	echo "${VERSION}" > ./docs/_includes/version.html
	git tag "${VERSION}"
	git add Makefile
	git commit -m "Version update > ${VERSION}"
	git push
	git tag --delete "${VERSION}"
	git tag -f "${VERSION}"
	git push --tags
