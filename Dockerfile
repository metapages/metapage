FROM haxe:3.4.7-alpine3.8 as builder
RUN apk --no-cache add \
	bash \
	g++ \
	gcc \
	git \
	jq \
	make \
	nodejs nodejs-npm \
  	py-pip

RUN pip install docker-compose
RUN npm install -g npx
WORKDIR /

ADD package.json .
ADD package-lock.json .
RUN npm i
# Can remove this soon I hope
# https://github.com/vuejs/vue-cli/issues/3407
RUN npm i terser@3.14
ADD build-base.hxml .
# If this changes, also change etc/makefiles/haxe.mk
RUN haxelib newrepo && haxelib install --always build-base.hxml

# FROM builder as haxe

# # First build the metapage/metaframe javascript libraries
# # by compiling the haxe->js

# ADD src ./src
# ADD build-metaframe.hxml .
# ADD build-metapage.hxml .
# ADD webpack.config.js .

# ARG DOCKER_TAG=none-set

# RUN echo "${DOCKER_TAG}" > ./.version
# RUN npx webpack --mode=production

# # Jekyll container serving the static website with metapage/frame libraries
# FROM jekyll/jekyll:latest as jekyll
# ADD ./docs /srv/jekyll
# RUN bundle install

# COPY --from=haxe /workspace/docs/js/*  /srv/jekyll/js/
# RUN ls /srv/jekyll/js