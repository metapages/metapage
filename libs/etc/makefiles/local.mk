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
