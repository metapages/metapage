BASE_DIST = dist/npm

.PHONY: help-npm
help-npm: help-impl-npm ## Print makefile update commands

# This expects NPM_TOKEN in the form: //registry.npmjs.org/:_authToken=XXX
# as this is what is directly dumped to the ~/.npmrc file (if it doesn't exist in that file)
.PHONY: npm-publish
npm-publish: guard-env-NPM_TOKEN guard-env-NPM_VERSION ###npm NPM publish the package internally, for testing
	@echo "PUBLISHING npm version ${NPM_VERSION}"
	@if ! grep --no-messages -q "${NPM_TOKEN}" "${HOME}/.npmrc" ; \
		then echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc ; \
	fi
	for name in "metaframe" "metapage" ; do \
		rm -rf ${BASE_DIST}/$${name} ; \
		mkdir -p ${BASE_DIST}/$${name} ; \
		cp docs/js/$${name}.js ${BASE_DIST}/$${name}/index.js ; \
		cat etc/npm/package.json | jq ". .version = \"${NPM_VERSION}\" | .name = \"$${name}\" | .main = \"$${name}.js\"" > ${BASE_DIST}/$${name}/package.json ; \
		pushd ${BASE_DIST}/$${name} ; \
		npm publish . || exit 1 ; \
		popd ; \
	done