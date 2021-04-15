# This Dockerfile is for doing CI type operations on the /app content and /cloud/*
#  - build/test/publish
#  - running the dev stack is done via the host, NOT with this image, due to docker/host/browser complications
#  - deploy via terraform/terragrunt
#
# Tools:
#  - docker + docker-compose
#  - just
#  - watchexec
#  - deno
#  - jq

# this special glibc alpine version is needed for deno to run
FROM frolvlad/alpine-glibc:alpine-3.12_glibc-2.32

RUN apk --no-cache --update add \
    bash \
    curl \
    docker \
    docker-compose \
    git \
    jq \
    ncurses

# just https://github.com/casey/just
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

# deno for scripting
ENV DENO_VERSION=1.5.3
RUN apk add --virtual .download --no-cache curl ; \
    SHA256SUM=2452296818a057db9bf307bd72c5da15883108415c1f7bd4f86153e3bce5cd44 ; \
    curl -fsSL https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip --output deno.zip \
    && (echo "$SHA256SUM  deno.zip" | sha256sum -c) \
    && unzip deno.zip \
    && rm deno.zip \
    && chmod 777 deno \
    && mv deno /bin/deno \
    && apk del .download

ENV DENO_DIR=/root/.deno

# Our workdir
WORKDIR /repo/cloud

###################################################################################################
# cloudseed deno scripts
###################################################################################################

# Copy deno scripts and other cloudseed machinery
COPY .cloudseed /repo/.cloudseed
# Cache all dependencies in the container so no external downloads needed in the cloud image
RUN find /repo/.cloudseed -type f -name "*.ts" -exec deno cache --unstable "{}" \;
# Avoid baking in paths everywhere: here is the root location of our deno scripts
ENV CLOUDSEED_DENO_ROOT=/repo/.cloudseed/deno


###################################################################################################
# final config
###################################################################################################

# Set a default git user.email so that git commits work inside the container.
# This is only typically used when iterating as a developer, so it shouldn't matter
# that the email is made up, you should squash commits when the pull request is merged,
# then the "developer@rom.com" commits are thrown out
RUN git config --global user.email "developer@rom.com"
# Show the just help on shell entry
RUN echo 'if [ -f justfile ]; then just; fi' >> /root/.bashrc
