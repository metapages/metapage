FROM docker/compose:1.22.0 as builder
RUN apk --no-cache add make

FROM haxe:3.4.7-alpine3.8 as haxe
RUN apk --no-cache add git
RUN apk --no-cache add nodejs nodejs-npm jq make gcc g++ git
RUN npm install -g chokidar-cli nodemon webpack-cli webpack

# First build the metapage/metaframe javascript libraries
# by compiling the haxe->js

WORKDIR /workspace
RUN npm i
ADD build.hxml ./build.hxml
RUN haxelib newrepo && haxelib install --always build.hxml
ADD src ./src

ARG DOCKER_TAG=none-set

RUN echo "${DOCKER_TAG}" > ./.version
RUN webpack

# Jekyll container serving the static website with metapage/frame libraries
FROM jekyll/jekyll:latest as jekyll
ADD ./docs /srv/jekyll
RUN bundle install

COPY --from=builder /workspace/docs/js/*  /srv/jekyll/js/
RUN ls /srv/jekyll/js