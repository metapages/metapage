SHELL                      = /bin/bash
VERSION                    = 0.0.9
GIT_REPO                   = dionjwa/metapage
BASE_DIST                  = dist/npm

.PHONY: start
start: install compile

.PHONY: travis
travis: install
	docker-compose run compile
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
	docker-compose run compile
	sed -i '' "s#metapage_library_path: \"https://cdn.*#metapage_library_path: \"https://cdn.jsdelivr.net/npm/metapage@${VERSION}/index.js\"#g" docs/_data/urls-internal.yml
	sed -i '' "s#metaframe_library_path: \"https://cdn.*#metaframe_library_path: \"https://cdn.jsdelivr.net/npm/metaframe@${VERSION}/index.js\"#g" docs/_data/urls-internal.yml

.PHONY: install
install:
	docker-compose run haxelibs
	docker-compose run node_modules

.PHONY: test-ci
test-ci: compile
	@echo 'Implement basic tests'

.PHONY: publish
publish: compile publish-internal

.PHONY: publish-internal
publish-internal:
	for name in "metaframe" "metapage" ; do \
		rm -rf ${BASE_DIST}/$${name} ; \
		mkdir -p ${BASE_DIST}/$${name} ; \
		cp docs/js/$${name}.js ${BASE_DIST}/$${name}/index.js ; \
		cat etc/npm/package.json | jq ". .version = \"${VERSION}\" | .name = \"$${name}\" | .main = \"$${name}.js\"" > ${BASE_DIST}/$${name}/package.json ; \
		pushd ${BASE_DIST}/$${name} ; \
		npm publish . ; \
		popd ; \
	done

.PHONY: clean
clean:
	rm -rf .haxelib

.PHONY: serve
serve:
	cd docs && docker-compose up

.PHONY: tag
tag:
	git tag "${VERSION}"
	git add Makefile
	git commit -m "Version update > ${VERSION}"
	git push
	git tag --delete "${VERSION}"
	git tag -f "${VERSION}"
	git push --tags