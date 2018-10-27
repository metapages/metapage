FROM haxe:3.4.7-alpine3.8 as base

RUN apk --no-cache add git

# Local code-watching dev image, based off the builder
FROM base as dev
RUN apk --no-cache add nodejs nodejs-npm jq make gcc g++
RUN npm install -g chokidar-cli nodemon webpack-cli webpack

# First build the metapage/metaframe javascript libraries
# by compiling the haxe->js
# FROM dionjwa/haxe-watch:v0.15.0 as client-builder
FROM base as client-build

# TODO: add git version hash and package version to bind
# the build step.

WORKDIR /client
ADD build.hxml /client/build.hxml
RUN haxelib newrepo && haxelib install --always build.hxml
ADD src /client/src

ARG GITSHA7=none-set

RUN echo "${GITSHA7}" > /client/.version
RUN haxe build.hxml

# Jekyll container serving the static website with metapage/frame libraries
FROM jekyll/jekyll:latest as prod
ADD ./docs /srv/jekyll
RUN bundle install

COPY --from=client-build /client/docs/js/*  /srv/jekyll/js/
RUN ls /srv/jekyll/js