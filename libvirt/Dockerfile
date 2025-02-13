FROM node:18 as development
# Install build tools
RUN apt-get update -y && apt-get install  -y \
    python \
    libvirt-dev \
    jq


WORKDIR /app
