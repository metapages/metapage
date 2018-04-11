SHELL                      = /bin/bash
VERSION                    = 0.0.1

.PHONY: install
install:
	mkdir -p .haxelib
	haxelib install --always build.hxml

.PHONY: build
build:
	VERSION=${VERSION} haxe build.hxml

.PHONY: publish
publish:
	echo "TODO"

.PHONY: clean
clean:
	rm -rf .haxelib
