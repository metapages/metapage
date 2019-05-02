# This is the root build container.
# This gets built first, then this has everything needed for all subsequent builds
# Plus nice tools like jq, the_silver_searcher, etc

FROM alpine:3.8.4 as builder
RUN apk --no-cache add \
    bash \
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

RUN pip install --upgrade pip==19.1
RUN pip install docker-compose

# There is no building/compiling here, it happens in the
# builder containers, via cloudbuild.yaml
