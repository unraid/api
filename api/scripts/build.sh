#!/usr/bin/env bash

WORKDIR="${WORKDIR:-$PWD}"

cd $WORKDIR

# Clean up last deploy
rm -f ./deploy/**/**/*
mkdir -p ./deploy/release/
mkdir -p ./deploy/pre-pack/

# Build binary
npm run build

# Copy binary + extra files to deployment directory
cp ./dist/api ./deploy/pre-pack/unraid-api
cp ./.env.production ./deploy/pre-pack/.env.production
cp ./.env.staging ./deploy/pre-pack/.env.staging

# Create deployment package.json
NAME=$(jq -r .name package.json)
VERSION=$(jq -r .version package.json)

# Decide whether to use full version or just tag
export GIT_SHA_SHORT=$(git rev-parse --short HEAD)
if git describe --tags --abbrev=0 --exact-match; 
then 
    export VERSION_TO_USE="${VERSION}"; 
else 
    export VERSION_TO_USE="${VERSION}+${GIT_SHA_SHORT}"; 
fi;

jq --null-input \
  --arg name "$NAME" \
  --arg version "$VERSION_TO_USE" \
  '{"name": $name, "version": $version}' > ./deploy/pre-pack/package.json

# Create final tgz
cp ./README.md ./deploy/pre-pack/
cd ./deploy/pre-pack
npm pack

# Move unraid-api.tgz to release directory
ls -1 unraid-api-* | xargs -n 1 | xargs -I{} mv {} ../release/{} 
