###########################################################
# Development/Build Image
###########################################################
ARG NODE_IMAGE=node:18
FROM $NODE_IMAGE As development

ARG NODE_ENV=development
ARG NPM_I_CMD=npm i

# Set env
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

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

# Install pkg and node-prune
RUN npm i -g pkg
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

CMD ["npm run build-docker"]