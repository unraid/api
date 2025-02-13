FROM node:20-bookworm-slim AS builder

# Install build tools and dependencies
RUN apt-get update -y && apt-get install -y \
    bash \
    # Real PS Command (needed for some dependencies)
    procps \ 
    python3 \
    libvirt-dev \
    jq \
    zstd \
    git \
    build-essential

RUN git config --global --add safe.directory /app

WORKDIR /app

COPY package.json ./

RUN npm install --include=dev

COPY . .

CMD ["npm", "run", "build"]