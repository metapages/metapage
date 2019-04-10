# Jekyll container serving the static website with metapage/frame libraries
FROM jekyll/jekyll:3.8.5 as jekyll

# For health checks
RUN apk --no-cache add curl

ADD ./Gemfile /srv/jekyll/Gemfile
ADD ./Gemfile.lock /srv/jekyll/Gemfile.lock

# `bundle update` updates Gemfile.lock with the latest allowed versions 
RUN cd /srv/jekyll && bundle install

ADD . /srv/jekyll

HEALTHCHECK --interval=6s --timeout=4s --start-period=10s CMD curl --fail http://localhost:4000 || exit 1
