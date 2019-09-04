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

# justfile
RUN mkdir -p /usr/local/bin && curl -LSfs https://japaric.github.io/trust/install.sh | \
  sh -s -- --git casey/just --target x86_64-unknown-linux-musl --to /usr/local/bin
ENV PATH $PATH:/usr/local/bin:.

# build tools
RUN npm install -g npx webpack webpack-cli nodemon

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
# shell containers, via cloudbuild.yaml

FROM shell-haxe as test
# For running tests. The container cannot mount in files at runtime (Google Cloud Build) so add everything now
ADD ./etc ./etc
ADD ./Makefile ./Makefile
ADD ./test ./test
