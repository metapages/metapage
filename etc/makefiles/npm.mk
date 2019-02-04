BASE_DIST          = ${PWD}/build/npm
HELP_NPM           = etc/makefiles/npm-help.md

.PHONY: help-npm
help-npm: help-impl-npm ## Print makefile update commands
	@ if [ -f "${HELP_NPM}" ]; then \
		cat "${HELP_NPM}" ; \
	fi

NPM_VERSION ?= 0.0.16-${RANDOM}
.PHONY: npm-publish
npm-publish: guard-env-NPM_TOKEN guard-env-NPM_VERSION ###npm NPM publish the packages (metaframe+metapage)
	@echo "PUBLISHING npm version ${NPM_VERSION}"
	@rm -rf ${BASE_DIST}
	@npx webpack --mode=production
	@for name in "metaframe" "metapage" ; do \
		cat package.json | jq ". .version = \"${NPM_VERSION}\" | .name = \"$${name}\"" > ${BASE_DIST}/$${name}/package.json ; \
		pushd ${BASE_DIST}/$${name} ; \
		echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> .npmrc ; \
		ln -s ${PWD}/node_modules . ; \
		cp ${PWD}/README-PACKAGE.md README.md ; \
		cp ${PWD}/LICENSE . ; \
		npm publish . || exit 1 ; \
		popd ; \
	done