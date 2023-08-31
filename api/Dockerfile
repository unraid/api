###########################################################
# Development/Build Image
###########################################################
FROM node:18.17.1-alpine As development

# Install build tools and dependencies
RUN apk add --no-cache \
    bash \
    alpine-sdk \
    python3 \
    libvirt-dev \
    jq \
    zstd

RUN mkdir /var/log/unraid-api/

WORKDIR /app

# Set app env
ENV NODE_ENV=development

# Setup cache for pkg
ENV PKG_CACHE_PATH /app/.pkg-cache
RUN mkdir -p ${PKG_CACHE_PATH}

COPY package.json package-lock.json ./
COPY tsconfig.json tsup.config.ts ./
COPY .npmrc ./
COPY .env.production .env.staging  ./

# Install deps
RUN npm i

# Install pkg
RUN npm i -g pkg zx

EXPOSE 4000

###########################################################
# Builder Image
###########################################################

FROM development AS builder

COPY ./src ./src

CMD ["npm", "run", "build-pkg"]