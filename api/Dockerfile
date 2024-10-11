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
    build-essential \
    zip \
    curl

RUN curl -fsSL https://deno.land/install.sh | sh -s -- -y

WORKDIR /app

# Set app env
ENV NODE_ENV=development

# Setup cache for pkg
ENV PKG_CACHE_PATH /app/.pkg-cache
RUN mkdir -p ${PKG_CACHE_PATH}

COPY tsconfig.json tsup.config.ts .eslintrc.cjs .npmrc .env.production .env.staging ./

COPY package.json package-lock.json ./

# Install deps
RUN npm i

RUN npm i -g node-gyp

RUN deno install --allow-read --allow-write --allow-env --allow-net --allow-run

# Add zx and pkg to the path
ENV PATH /root/.deno/bin:$PATH
ENV PATH /app/node_modules/.bin:$PATH

EXPOSE 4000

###########################################################
# Builder Image
###########################################################

FROM development AS builder

COPY . .

CMD ["npm", "run", "build-pkg"]