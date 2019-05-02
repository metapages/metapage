.PHONY: help-jekyll
help-jekyll: help-impl-jekyll ## Jekyll commands


.PHONY: jekyll-shell
jekyll-shell: ###jekyll shell into a locally mounted jekyll container to update Gemfile.lock
	docker run --rm -ti -v ${PWD}:/srv/jekyll -w /srv/jekyll jekyll/jekyll:latest /bin/sh

# https://pmarsceill.github.io/just-the-docs/docs/search/
.PHONY: jekyll-generate-search
jekyll-generate-search: ###jekyll generate the client-side search index
	docker run --rm -ti -v ${PWD}:/srv/jekyll -w /srv/jekyll jekyll/jekyll:latest bundle exec just-the-docs rake search:init
