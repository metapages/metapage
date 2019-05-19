# This is the builder image for compiling haxe -> javascript libraries
# and for running functional tests (requires puppeteer/chromium)

FROM haxe:4.0.0-rc.2-alpine3.8 as builder-haxe
RUN apk --no-cache add \
	bash \
	curl \
	g++ \
	gcc \
	git \
	jq \
	make \
	nodejs nodejs-npm \
	python-dev \
	openssl-dev \
	libffi-dev

RUN curl -LSfs https://japaric.github.io/trust/install.sh | \
  sh -s -- --git casey/just --target x86_64-unknown-linux-musl --to /bin

RUN npm install -g npx webpack webpack-cli nodemon

RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
      chromium@edge \
      nss@edge \
      freetype@edge \
      harfbuzz@edge \
      ttf-freefont@edge

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install the 3rd party dependencies into the root
# because we cannot use the dependencies if they are
# mounted into the same root folder as the codebase.
# So they are installed into a place easy to remember
# to mount from.
# The mounting happens in cloudbuild.yaml
# and is simply symlinking /node_modules and /.haxelib to /workspace
# This is done with `make set-context-container`
WORKDIR /
ADD package.json .
ADD package-lock.json .

RUN npm i


ADD build-base.hxml .
# If this changes, also change etc/makefiles/haxe.mk
RUN haxelib newrepo && haxelib install --always build-base.hxml

# Best to remove these so other scripts cannot possibly be confused
RUN rm package.json && rm package-lock.json && rm build-base.hxml

ENV CI true
WORKDIR /workspace

# There is no building/compiling here, it happens in the
# builder containers, via cloudbuild.yaml


FROM builder-haxe as test
# For running tests. The container cannot mount in files at runtime (Google Cloud Build) so add everything now
ADD ./etc ./etc
ADD ./Makefile ./Makefile
ADD ./test ./test
CMD make test
