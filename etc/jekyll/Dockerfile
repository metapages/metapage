# Jekyll container serving the static website with metapage/frame libraries
FROM jekyll/jekyll:latest as jekyll
ADD ./docs /srv/jekyll
RUN bundle install

# COPY --from=haxe /workspace/docs/js/*  /srv/jekyll/js/
RUN ls /srv/jekyll/js