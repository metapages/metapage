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
RUN npm install -g npx webpack webpack-cli

# Install the 3rd party dependencies into the root
# because we cannot use the dependencies if they are
# mounted into the same root folder as the codebase.
# So they are installed into a place easy to remember
# to mount from.
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

# There is no building/compiling here, it happens in the
# builder containers, not the base image
