#!/usr/bin/env bash

WORKDIR="${WORKDIR:-$PWD}"

cd $WORKDIR

rm -f ./deploy/**/**/*

npm run build
npm run clean
./scripts/copy-full-version.sh
mkdir -p ./deploy/release/
mkdir -p ./deploy/pre-pack/
cp ./dist/api ./deploy/pre-pack/unraid-api
cp ./.env.production ./deploy/pre-pack/.env.production
cp ./.env.staging ./deploy/pre-pack/.env.staging
cp ./package-deployment.json ./deploy/pre-pack/package.json
cp ./README.md ./deploy/pre-pack/
cd ./deploy/pre-pack
npm pack
ls -1 unraid-api-* | xargs -L1 -I{} mv {} ../release/{} 
