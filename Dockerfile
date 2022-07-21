###########################################################
# Development/Build Image
###########################################################
ARG NODE_IMAGE=node:18
FROM $NODE_IMAGE As development

ARG NODE_ENV=development
ARG NPM_I_CMD=npm i
# Set env
ENV NODE_ENV=$NODE_ENV

# Copy package lock and package into build image
WORKDIR /app
COPY package.json package-lock.json tsconfig.json .npmrc ./

# Install build tools
RUN apt-get update -y && apt-get install  -y \
python \
libvirt-dev

# Install deps
RUN $NPM_I_CMD

RUN npm i -g nexe
# Run build script if one exists
# RUN npm run build --if-present

CMD ["npm run build-binary"]