SHELL                      = /bin/bash
VERSION                    = 0.0.6
GIT_REPO                   = dionjwa/metapage
BASE_DIST                  = dist/npm

.PHONY: start
start: install build

.PHONY: travis
travis: publish
	@if [ "${TRAVIS_BRANCH}" == "master" ] && [ "${TRAVIS_PULL_REQUEST}" != "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ]; \
		then make test-ci ; \
	fi
	@if [ "${TRAVIS_PULL_REQUEST}" == "false" ] && [ "${TRAVIS_REPO_SLUG}" == "${GIT_REPO}" ] && [ "${VERSION}" == "${TRAVIS_TAG}" ] && [ ! -z "${NPM_TOKEN}" ]; \
		then make publish-internal ; \
	fi

.PHONY: build
build:
	haxe build.hxml
	rm -rf docs/js/metapage-*
	rm -rf docs/js/metaframe-*
	cp docs/js/metapage.js docs/js/metapage-${VERSION}.js
	cp docs/js/metaframe.js docs/js/metaframe-${VERSION}.js
	@echo "metapage_library_path: \"/js/metapage-${VERSION}.js\"" > docs/_data/urls-internal.yml
	@echo "metaframe_library_path: \"/js/metaframe-${VERSION}.js\"" >> docs/_data/urls-internal.yml

.PHONY: install
install:
	mkdir -p .haxelib
	haxelib install --always build.hxml

.PHONY: test-ci
test-ci: build
	@echo 'Implement basic tests'

.PHONY: publish
publish: build publish-internal

.PHONY: publish-internal
publish-internal:
	for name in "metaframe" "metapage" ; do \
		rm -rf ${BASE_DIST}/$${name} ; \
		mkdir -p ${BASE_DIST}/$${name} ; \
		cp docs/js/$${name}-${VERSION}.js* ${BASE_DIST}/$${name}/index.js ; \
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
tag: tag-update-files
	git tag "${VERSION}"
	git commit -m "Version update > ${VERSION}"
	git push
	git tag --delete "${VERSION}"
	git tag -f "${VERSION}"
	git push --tags