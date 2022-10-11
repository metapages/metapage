#################################################################
# Base image
# This is the shell image for compiling haxe -> javascript libraries
# and for running functional tests (requires puppeteer/chromium)
#################################################################

FROM zenika/alpine-chrome:100-with-puppeteer as build

USER root
RUN apk update && apk upgrade && apk --no-cache add \
	bash \
	curl \
    jq

# justfile https://github.com/casey/just
RUN VERSION=1.0.0 ; \
    SHA256SUM=342f8582d929b9212ffcbe9f7749e12908053cf215eb8d4a965c47ea2f24b0a4 ; \
    curl -L -O https://github.com/casey/just/releases/download/$VERSION/just-$VERSION-x86_64-unknown-linux-musl.tar.gz && \
    (echo "$SHA256SUM  just-$VERSION-x86_64-unknown-linux-musl.tar.gz" | sha256sum -c -) && \
    mkdir -p /usr/local/bin && \
    tar -xzf just-$VERSION-x86_64-unknown-linux-musl.tar.gz -C /usr/local/bin just && \
    rm -rf just-$VERSION-x86_64-unknown-linux-musl.tar.gz
# Unify the just binary location on host and container platforms because otherwise the shebang doesn't work properly due to no string token parsing (it gets one giant string)
ENV PATH $PATH:/usr/local/bin
# alias "j" to just, it's just right there index finger
RUN echo -e '#!/bin/bash\njust "$@"' > /usr/bin/j && \
    chmod +x /usr/bin/j

# watchexec for live reloading in development https://github.com/watchexec/watchexec
RUN VERSION=1.14.1 ; \
    SHA256SUM=34126cfe93c9c723fbba413ca68b3fd6189bd16bfda48ebaa9cab56e5529d825 ; \
    curl -L -O https://github.com/watchexec/watchexec/releases/download/$VERSION/watchexec-$VERSION-i686-unknown-linux-musl.tar.xz && \
    (echo "$SHA256SUM  watchexec-${VERSION}-i686-unknown-linux-musl.tar.xz" | sha256sum -c) && \
    tar xvf watchexec-$VERSION-i686-unknown-linux-musl.tar.xz watchexec-$VERSION-i686-unknown-linux-musl/watchexec -C /usr/bin/ --strip-components=1 && \
    rm -rf watchexec-*

RUN apk update && apk upgrade && apk --no-cache add \
	npm

RUN npm install -g npm@8.17.0

RUN mkdir -p /workspace/libs
RUN chown -R chrome:chrome /workspace/libs

# https://github.com/metapages/metapage/issues/118
# USER chrome

#################################################################
# libs: setup
#################################################################
WORKDIR /workspace/libs
ADD package.json ./
ADD package-lock.json ./
RUN npm i --silent

# see https://github.com/parcel-bundler/parcel/issues/2031
ENV PARCEL_WORKERS=1

#################################################################
# libs: build (via just commands in docker-compose)
#################################################################

ADD tsconfig.json ./tsconfig.json
ADD justfile ./justfile
ADD README.md ./
ADD LICENSE ./
ADD src ./src
ADD test ./test
ADD healthcheck.ts /healthcheck.ts
