# This is the shell image for compiling haxe -> javascript libraries
# and for running functional tests (requires puppeteer/chromium)

FROM haxe:4.0.0-rc.3-alpine3.10 as shell-haxe

RUN apk update && apk upgrade && apk --no-cache add \
	bash \
	curl \
	chromium \
	g++ \
	gcc \
	git \
	jq \
	make \
	nodejs nodejs-npm \
	python-dev \
	openssl-dev \
	libffi-dev

# justfile https://github.com/casey/just
RUN VERSION=0.5.1 ; \
    SHA256SUM=13e3411f137bf7b94bc6844820f11725f98621cfea3244bd33943cfa1b4c81fc ; \
    curl -L -O https://github.com/casey/just/releases/download/v$VERSION/just-v$VERSION-x86_64-unknown-linux-musl.tar.gz && \
    (echo "$SHA256SUM  just-v$VERSION-x86_64-unknown-linux-musl.tar.gz" | sha256sum  -c -) && \
    mkdir -p /tmp/just && mv just-v$VERSION-x86_64-unknown-linux-musl.tar.gz /tmp/just && cd /tmp/just && \
    tar -xzf just-v$VERSION-x86_64-unknown-linux-musl.tar.gz && \
    mkdir -p /usr/local/bin && mv /tmp/just/just /usr/local/bin/ && rm -rf /tmp/just
# just tweak: unify the just binary location on host and container platforms because otherwise the shebang doesn't work properly due to no string token parsing (it gets one giant string)
ENV PATH $PATH:/usr/local/bin

# build tools
RUN npm install -g nodemon

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /workspace/libs
ADD package.json ./
ADD package-lock.json ./
RUN npm i

ADD ts ./ts
ADD tsconfig.json ./tsconfig.json
ADD justfile ./justfile

# Best to remove these so other scripts cannot possibly be confused
# RUN rm package.json && rm package-lock.json && rm build-base.hxml

# ENV CI true


# There is no building/compiling here, it happens in the
# shell containers, via cloudbuild.yaml







FROM shell-haxe as test
# For running tests. The container cannot mount in files at runtime (Google Cloud Build) so add everything now
# ADD ./etc ./etc
# ADD ./Makefile ./Makefile
ADD ./test ./test
