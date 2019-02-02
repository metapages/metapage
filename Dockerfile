FROM haxe:3.4.7-alpine3.8 as builder

RUN apk --no-cache add git
RUN apk --no-cache add nodejs nodejs-npm jq make gcc g++ git
RUN npm install -g chokidar-cli nodemon webpack-cli webpack

# First build the metapage/metaframe javascript libraries
# by compiling the haxe->js

WORKDIR /client
ADD build.hxml /client/build.hxml
RUN haxelib newrepo && haxelib install --always build.hxml
ADD src /client/src

ARG GITSHA7=none-set

RUN echo "${GITSHA7}" > /client/.version
RUN haxe build.hxml

# Jekyll container serving the static website with metapage/frame libraries
FROM jekyll/jekyll:latest as jekyll
ADD ./docs /srv/jekyll
RUN bundle install

COPY --from=builder /client/docs/js/*  /srv/jekyll/js/
RUN ls /srv/jekyll/js