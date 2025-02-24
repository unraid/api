###########################################################
# Development/Build Image
###########################################################
FROM node:22-bookworm-slim AS development

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
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate && npm i -g npm@latest

COPY tsconfig.json .eslintrc.ts .prettierrc.cjs .npmrc .env.production .env.staging package.json pnpm-lock.yaml .npmrc ./

# Install deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

EXPOSE 3001

###########################################################
# Builder Image
###########################################################

FROM development AS builder

ENV NODE_ENV=production

COPY . .

CMD ["pnpm", "run", "build-and-pack"]