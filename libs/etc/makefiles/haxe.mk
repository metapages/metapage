.PHONY: help-hx
help-hx: help-impl-hx ## Haxe commands

.PHONY: hx-haxelib
hx-haxelib: ###hx Install haxelib libaries
	# If this changes, also change Dockerfile
	haxelib newrepo && haxelib install --always build-base.hxml
