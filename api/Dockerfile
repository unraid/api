###########################################################
# Development/Build Image
###########################################################
FROM node:18.19.1-bookworm-slim As development

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

# Setup cache for pkg
ENV PKG_CACHE_PATH /app/.pkg-cache
RUN mkdir -p ${PKG_CACHE_PATH}

COPY tsconfig.json tsup.config.ts .eslintrc.cjs .npmrc .env.production .env.staging ./

COPY package.json package-lock.json ./

# Install pkg
RUN npm i -g pkg zx

# Install deps
RUN npm i

EXPOSE 4000

###########################################################
# Builder Image
###########################################################

FROM development AS builder

COPY . .

CMD ["npm", "run", "build-pkg"]