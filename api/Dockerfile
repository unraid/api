###########################################################
# Development/Build Image
###########################################################
ARG NODE_IMAGE=node:18
FROM $NODE_IMAGE As development

# Install build tools
RUN apt-get update -y && apt-get install  -y \
    python \
    libvirt-dev \
    jq \
    zstd

RUN mkdir /var/log/unraid-api/


ARG NODE_ENV=development
ARG NPM_I_CMD=npm i

WORKDIR /app

# Set app env
ENV NODE_ENV=$NODE_ENV

# Setup cache for pkg
ENV PKG_CACHE_PATH /app/.pkg-cache
RUN mkdir -p ${PKG_CACHE_PATH}

COPY package.json package-lock.json ./
COPY tsconfig.json tsup.config.ts ./
COPY .npmrc ./
COPY .env.production .env.staging  ./

# Install deps
RUN $NPM_I_CMD

# Install pkg
RUN npm i -g pkg zx

EXPOSE 4000

CMD ["npm", "run", "build-pkg"]