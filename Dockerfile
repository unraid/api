###########################################################
# Development/Build Image
###########################################################
ARG NODE_IMAGE=node:18
FROM $NODE_IMAGE As development

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
COPY .git/ ./.git/
COPY .npmrc ./
COPY .env.production .env.staging  ./

# Install build tools
RUN apt-get update -y && apt-get install  -y \
python \
libvirt-dev \
jq

# Install deps
RUN $NPM_I_CMD

# Install pkg
RUN npm i -g pkg

CMD ["npm", "run", "build-pkg"]