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

# justfile https://github.com/casey/just
RUN VERSION=0.8.4 ; \
    SHA256SUM=c361b0df74dcd64f7a8aeb839dce5ae2bb0d14b8ceb2046b4828ee042ec7c98e ; \
    curl -L -O https://github.com/casey/just/releases/download/v$VERSION/just-v$VERSION-x86_64-unknown-linux-musl.tar.gz && \
    (echo "$SHA256SUM  just-v$VERSION-x86_64-unknown-linux-musl.tar.gz" | sha256sum  -c -) && \
    mkdir -p /tmp/just && mv just-v$VERSION-x86_64-unknown-linux-musl.tar.gz /tmp/just && cd /tmp/just && \
    tar -xzf just-v$VERSION-x86_64-unknown-linux-musl.tar.gz && \
    mkdir -p /usr/local/bin && mv /tmp/just/just /usr/local/bin/ && rm -rf /tmp/just
# just tweak: unify the just binary location on host and container platforms because otherwise the shebang doesn't work properly due to no string token parsing (it gets one giant string)
ENV PATH $PATH:/usr/local/bin

# watchexec for live reloading in development https://github.com/watchexec/watchexec
RUN VERSION=1.14.1 ; \
    SHA256SUM=34126cfe93c9c723fbba413ca68b3fd6189bd16bfda48ebaa9cab56e5529d825 ; \
    curl -L -O https://github.com/watchexec/watchexec/releases/download/$VERSION/watchexec-$VERSION-i686-unknown-linux-musl.tar.xz && \
    (echo "$SHA256SUM  watchexec-${VERSION}-i686-unknown-linux-musl.tar.xz" | sha256sum -c) && \
    tar xvf watchexec-$VERSION-i686-unknown-linux-musl.tar.xz watchexec-$VERSION-i686-unknown-linux-musl/watchexec -C /usr/bin/ --strip-components=1 && \
    rm -rf watchexec-*

# If you don't set up permissive permissions, jekyll fails all over
RUN mkdir -p /workspace/docs && chmod 777 /workspace/docs
WORKDIR /workspace/docs
ADD ./Gemfile ./Gemfile
ADD ./Gemfile.lock ./Gemfile.lock

# `bundle update` updates Gemfile.lock with the latest allowed versions
RUN mkdir -p /jekyll/gems && chmod 777 /jekyll/gems && bundle config set --local path '/jekyll/gems'
RUN bundle install

ADD . /workspace/docs
# COPY --from=libs /workspace/libs/dist/@metapage/metapage/browser /workspace/docs/js

RUN mkdir -p /docs && chmod 777 /docs
RUN JEKYLL_ENV=production bundle exec jekyll build --disable-disk-cache --strict_front_matter --trace --config _config.yml --destination /docs

HEALTHCHECK --interval=3s --timeout=2s --start-period=5s CMD curl --fail http://localhost:4000 || exit 1
