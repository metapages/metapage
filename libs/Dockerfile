

#################################################################
# Base image
# This is the shell image for compiling haxe -> javascript libraries
# and for running functional tests (requires puppeteer/chromium)
#################################################################

FROM us.gcr.io/zenika-hub/alpine-chrome:85-with-puppeteer as build
# FROM haxe:4.0.0-rc.3-alpine3.10 as shell-haxe

RUN apk update && apk upgrade && apk --no-cache add \
	bash \
	curl

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

RUN npm install -g npm@6.14.5

#################################################################
# libs: setup
#################################################################
WORKDIR /workspace/libs
ADD package.json ./
ADD package-lock.json ./
RUN npm i

#################################################################
# libs: build
#################################################################

ADD src ./src
ADD tsconfig.json ./tsconfig.json
ADD justfile ./justfile

#################################################################
# test
#################################################################

FROM build as test
# For running tests. The container cannot mount in files at runtime (in cloud CI builds) so add everything now
ADD ./test ./test
