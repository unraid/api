FROM node:20-bookworm-slim AS development
# Install build tools
RUN apt-get update -y && apt-get install  -y \
    python3 \
    libvirt-dev \
    jq

# Install pnpm globally using npm
RUN npm install -g pnpm@latest

WORKDIR /app
