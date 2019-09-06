# This is the root build container.
# This gets built first, then this has everything needed for all subsequent builds
# Plus nice tools like jq, the_silver_searcher, etc

FROM alpine:3.8.4 as shell
RUN apk --no-cache add \
    bash \
    curl \
    docker \
    g++ \
    gcc \
    git \
    jq \
    libffi-dev \
    make \
    openssl-dev \
    py-pip \
    python-dev \
    the_silver_searcher

RUN mkdir -p /usr/local/bin && curl -LSfs https://japaric.github.io/trust/install.sh | \
  sh -s -- --git casey/just --target x86_64-unknown-linux-musl --to /usr/local/bin
ENV PATH $PATH:/usr/local/bin:.
  
RUN pip install --upgrade pip==19.1
RUN pip install docker-compose

# There is no building/compiling here, it happens in the
# shell containers, via cloudbuild.yaml
