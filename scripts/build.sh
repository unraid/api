#!/usr/bin/env bash

WORKDIR="${WORKDIR:-$PWD}"

cd $WORKDIR

rm -f ./deploy/**/**/*

./scripts/copy-full-version.sh

npm run build
npm run clean
mkdir -p ./deploy/release/
mkdir -p ./deploy/pre-pack/
cp ./dist/api ./deploy/pre-pack/unraid-api
cp ./.env.production ./deploy/pre-pack/.env.production
cp ./.env.staging ./deploy/pre-pack/.env.staging

NAME=$(jq -r .name package.json)
VERSION=$(jq -r .version package.json)
jq --null-input \
  --arg name "$NAME" \
  --arg version "$VERSION" \
  '{"name": $name, "version": $version}' > ./deploy/pre-pack/package.json

cp ./README.md ./deploy/pre-pack/
cd ./deploy/pre-pack
npm pack
ls -1 unraid-api-* | xargs -L1 -I{} mv {} ../release/{} 
