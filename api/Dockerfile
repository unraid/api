###########################################################
# Development/Build Image
###########################################################
FROM oven/bun:1.2.2-slim AS development

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

WORKDIR /app

# Set app env
ENV NODE_ENV=development

COPY tsconfig.json .eslintrc.ts .prettierrc.cjs .npmrc .env.production .env.staging ./

COPY package.json package-lock.json ./

# Install deps
RUN bun install

EXPOSE 4000

###########################################################
# Builder Image
###########################################################

FROM development AS builder

ENV NODE_ENV=production

COPY . .

CMD ["bun", "run", "build-and-pack"]