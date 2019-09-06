# Jekyll container serving the static website with metapage/frame libraries
# Make sure we're using the correct version hosted by github
# https://pages.github.com/versions/
FROM jekyll/jekyll:3.8.5 as jekyll

# For health checks
RUN apk --no-cache add curl

WORKDIR /workspace
ADD ./Gemfile Gemfile
ADD ./Gemfile.lock Gemfile.lock

# `bundle update` updates Gemfile.lock with the latest allowed versions 
RUN bundle install

ADD . /workspace
RUN chown -R jekyll:jekyll /workspace

HEALTHCHECK --interval=20s --timeout=4s --start-period=10s CMD curl --fail http://localhost:4000 || exit 1
