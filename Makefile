SHELL                      = /bin/bash
VERSION                    = 0.0.1

.PHONY: build
build:
	haxe build.hxml
	cp docs/js/metapage.js docs/js/metapage-${VERSION}.js
	cp docs/js/metaframe.js docs/js/metaframe-${VERSION}.js

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
