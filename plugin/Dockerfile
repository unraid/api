FROM node:22-bookworm-slim AS plugin-builder

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

RUN corepack enable && pnpm install

# Install a simple http server
RUN npm install -g http-server

# Expose port 8080
EXPOSE 8080

COPY scripts/entrypoint.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT [ "/start.sh" ]

CMD [ "pnpm", "run", "build:watcher" ]
