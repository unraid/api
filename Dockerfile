###########################################################
# Development/Build Image
###########################################################
ARG NODE_IMAGE=node:18
FROM $NODE_IMAGE As development

RUN npm i -g npm@7

ARG NODE_ENV=development
ARG NPM_I_CMD=npm i

# Set env
ENV NODE_ENV=$NODE_ENV

# Copy package lock and package into build image
WORKDIR /app

COPY package.json package-lock.json tsconfig.json .git .npmrc ./
# Install build tools
RUN apt-get update -y && apt-get install  -y \
python \
libvirt-dev \
jq

# Install deps
RUN $NPM_I_CMD

# Install nexe and node-prune
RUN npm i -g nexe
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

CMD ["npm run build-docker"]