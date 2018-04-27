SHELL                      = /bin/bash
VERSION                    = 0.0.1

.PHONY: start
start: install build

.PHONY: build
build:
	haxe build.hxml
	rm -rf docs/js/metapage-*
	rm -rf docs/js/metaframe-*
	cp docs/js/metapage.js docs/js/metapage-${VERSION}.js
	cp docs/js/metaframe.js docs/js/metaframe-${VERSION}.js
	echo "metapage_library_path: \"/js/metapage-${VERSION}.js\"" > docs/_data/urls-internal.yml
	echo "metaframe_library_path: \"/js/metaframe-${VERSION}.js\"" >> docs/_data/urls-internal.yml

.PHONY: install
install:
	mkdir -p .haxelib
	haxelib install --always build.hxml

.PHONY: publish
publish:
	echo "TODO"

.PHONY: clean
clean:
	rm -rf .haxelib

