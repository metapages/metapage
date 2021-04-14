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

#sops (keys and encrypting secrets)
ENV SOPS_VERSION=3.6.1
RUN curl -L -O https://github.com/mozilla/sops/releases/download/v${SOPS_VERSION}/sops-v${SOPS_VERSION}.linux && \
    mv sops-v${SOPS_VERSION}.linux /usr/bin/sops && \
    chmod 755 /usr/bin/sops && \
    sops --version

# terraform
ENV VERSION_TERRAFORM=0.13.6
RUN PACKAGE=terraform ; VERSION=${VERSION_TERRAFORM} ; \
    SHA256SUM=55f2db00b05675026be9c898bdd3e8230ff0c5c78dd12d743ca38032092abfc9 ; \
    curl -L -O https://releases.hashicorp.com/${PACKAGE}/${VERSION}/${PACKAGE}_${VERSION}_linux_amd64.zip && \
    (echo "$SHA256SUM  ${PACKAGE}_${VERSION}_linux_amd64.zip" | sha256sum -c) && \
	unzip ${PACKAGE}_${VERSION}_linux_amd64.zip && \
	rm ${PACKAGE}_${VERSION}_linux_amd64.zip && \
    mv ${PACKAGE} /usr/local/bin/${PACKAGE} && chmod +x /usr/local/bin/${PACKAGE}

# gcloud
ARG VERSION_gcloud_sdk=324.0.0
ENV VERSION_gcloud_sdk=$VERSION_gcloud_sdk
ENV CLOUDSDK_CORE_DISABLE_PROMPTS=1
ENV PATH /google-cloud-sdk/bin:$PATH
# libc6-compat package not needed due to the above alpine-3.12_glibc-2.32
RUN apk --no-cache add \
    python3 \
    py3-crcmod \
    openssh-client \
    git \
    gnupg \
    && curl -L -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${VERSION_gcloud_sdk}-linux-x86_64.tar.gz && \
    tar xzf google-cloud-sdk-${VERSION_gcloud_sdk}-linux-x86_64.tar.gz && \
    rm google-cloud-sdk-${VERSION_gcloud_sdk}-linux-x86_64.tar.gz && \
    gcloud config set core/disable_usage_reporting true && \
    gcloud config set component_manager/disable_update_check true && \
    gcloud config set metrics/environment github_docker_image && \
    gcloud --version
RUN git config --system credential.'https://source.developers.google.com'.helper gcloud.sh
VOLUME ["/root/.config"]
# beta components required all over the place
RUN gcloud components install beta
RUN gcloud components install alpha


# terragrunt
RUN PACKAGE=terragrunt ; VERSION=v0.27.1 ; \
    SHA256SUM=b9f174e6613fe84121352ecdd238783504b642d390df87f8f8d760b42c44c02a ; \
    curl -L -O https://github.com/gruntwork-io/${PACKAGE}/releases/download/${VERSION}/${PACKAGE}_linux_amd64 && \
    (echo "$SHA256SUM  ${PACKAGE}_linux_amd64" | sha256sum -c) && \
    mv ${PACKAGE}_linux_amd64 /usr/local/bin/${PACKAGE} && chmod +x /usr/local/bin/${PACKAGE}

# terraform modules are fetched here and the versions hard coded
# it prevents wasted time downloading plugins all the time but does
# bake in versions. i think the trade-off is worth it, but updgrades
# will have to be done carefully, but upgrading a plugin then updating
# all the terraform deployments
# ENV TERRAFORM_PLUGIN_DIR=/usr/local/share/terraform/plugin-cache
# https://www.terraform.io/docs/commands/cli-config.html#provider-plugin-cache
ENV TF_PLUGIN_CACHE_DIR=/root/.terraform.d/plugin-cache

RUN mkdir -p $TF_PLUGIN_CACHE_DIR
# ENV XDG_DATA_DIRS=/root
# WORKDIR ${TERRAFORM_PLUGIN_DIR}

# Some modules need random
ENV VERSION_TERRAFORM_RANDOM=2.2.1
# RUN PACKAGE=terraform-provider-random ; VERSION=${VERSION_TERRAFORM_RANDOM} ; \
#     curl -L -O https://releases.hashicorp.com/${PACKAGE}/${VERSION}/${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	unzip ${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	rm ${PACKAGE}_${VERSION}_linux_amd64.zip

ENV VERSION_TERRAFORM_GOOGLE=3.53.0
ENV VERSION_TERRAFORM_GOOGLE_BETA=3.53.0
# RUN PACKAGE=terraform-provider-google ; VERSION=${VERSION_TERRAFORM_GOOGLE} ; \
#     curl -L -O https://releases.hashicorp.com/${PACKAGE}/${VERSION}/${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	unzip ${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	rm ${PACKAGE}_${VERSION}_linux_amd64.zip

ENV VERSION_TERRAFORM_NULL=3.0.0
# RUN PACKAGE=terraform-provider-null ; VERSION=${VERSION_TERRAFORM_NULL} ; \
#     curl -L -O https://releases.hashicorp.com/${PACKAGE}/${VERSION}/${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	unzip ${PACKAGE}_${VERSION}_linux_amd64.zip && \
# 	rm ${PACKAGE}_${VERSION}_linux_amd64.zip
ENV VERSION_TERRAFORM_TEMPLATE=2.2.0



ENV DENO_DIR=/root/.deno

# Our workdir
WORKDIR /repo/cloud

# Core cloud libraries
# COPY ci /repo/ci

# Core cloud libraries
COPY .cloudseed/cloud/lib/terragrunt /repo/cloud/lib/terragrunt
# copy (seed) the terraform plugin cache as a workaround to terragrunt and plugin cache problems: https://github.com/gruntwork-io/terragrunt/issues/1212
# https://www.terraform.io/docs/commands/cli-config.html#implied-local-mirror-directories
RUN cd /repo/cloud/lib/terragrunt terragrunt providers mirror /usr/local/share/terraform/plugins
RUN cd /repo/cloud/lib/terragrunt && mkdir -p /cloudseed && terragrunt init && rm provider.tf

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
