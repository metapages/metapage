BASE_DIST          = ${PWD}/build/npm
HELP_NPM           = etc/makefiles/npm-help.md

.PHONY: help-npm
help-npm: help-impl-npm ## Print makefile update commands
	@ if [ -f "${HELP_NPM}" ]; then \
		cat "${HELP_NPM}" ; \
	fi

.PHONY: npm-publish
npm-publish: guard-env-NPM_TOKEN ###npm NPM publish the packages (metaframe+metapage)
	@echo "PUBLISHING npm version $$(cat package.json | jq -r '.version')"
	@rm -rf ${BASE_DIST}
	@npx webpack --mode=production
	@for name in "metaframe" "metapage" ; do \
		mkdir -p ${BASE_DIST}/$${name} ; \
		cat package.json | jq ". .name = \"$${name}\"" > ${BASE_DIST}/$${name}/package.json ; \
		cp README-PACKAGE.md ${BASE_DIST}/$${name}/ ; \
		cp LICENSE ${BASE_DIST}/$${name}/ ; \
		echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ${BASE_DIST}/$${name}/.npmrc ; \
		ln -s node_modules ${BASE_DIST}/$${name}/nodemodules ; \
		pushd ${BASE_DIST}/$${name} ; \
		npm publish . || exit 1 ; \
		popd ; \
	done

# Make a command for updating the version
# Unless the version is passed in, get the version from the current version
# and bump it, commit the change, and tag it
# Make sure to use: git push origin --follow-tags


