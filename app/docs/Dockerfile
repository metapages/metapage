#################################################################
# libs image to pull in static assets
#################################################################

# You cannot use build args as in: COPY --from=${someval}
# https://github.com/docker/for-mac/issues/2155
# workaround: declare COPY --from args before the main FROM image
# ARG DOCKER_TAG=cache
# ARG DOCKER_REGISTRY
# ARG DOCKER_IMAGE_PREFIX

# FROM ${DOCKER_REGISTRY}${DOCKER_IMAGE_PREFIX}libs:${DOCKER_TAG} as libs

#################################################################
# Base image
#################################################################
# To shell into this container: just build docs && just docker-compose run --rm -w /workspace/docs -v $(pwd)/docs:/workspace/docs docs bash


# Jekyll container serving the static website with metapage/frame libraries
# Make sure we're using the correct version hosted by github
# https://pages.github.com/versions/
# FROM jekyll/jekyll:3.8.5 as jekyll
FROM jekyll/jekyll:4.2.0 as jekyll

# For health checks
RUN apk upgrade && apk --no-cache add curl bash

WORKDIR /workspace/docs
# If you don't set up permissive permissions, jekyll fails all over
RUN mkdir -p /workspace/docs && chmod 777 /workspace/docs
ADD ./Gemfile ./Gemfile
ADD ./Gemfile.lock ./Gemfile.lock

# `bundle update` updates Gemfile.lock with the latest allowed versions
RUN mkdir -p /jekyll/gems && chmod 777 /jekyll/gems && bundle config set --local path '/jekyll/gems'
RUN bundle install

ADD . /workspace/docs
# COPY --from=libs /workspace/libs/dist/@metapage/metapage/browser /workspace/docs/js

RUN jekyll build --config _config.yml

HEALTHCHECK --interval=3s --timeout=2s --start-period=5s CMD curl --fail http://localhost:4000 || exit 1
