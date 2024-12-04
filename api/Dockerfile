###########################################################
# Development/Build Image
###########################################################
FROM node:20-bookworm-slim AS development

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
    build-essential \
    curl

# Install rust toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN cargo install --locked watchexec-cli

WORKDIR /app

# Set app env
ENV NODE_ENV=development

COPY tsconfig.json .eslintrc.ts .npmrc .env.production .env.staging ./

COPY package.json package-lock.json ./

# Install deps
RUN npm i

EXPOSE 4000

###########################################################
# Builder Image
###########################################################

FROM development AS builder

ENV NODE_ENV=production

COPY . .

CMD ["npm", "run", "build-and-pack"]