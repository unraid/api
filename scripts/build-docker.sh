#!/usr/bin/env bash

rm -f /app/deploy/**/**/*

npm run build
npm run clean
/app/scripts/copy-full-version.sh
mkdir -p /app/deploy/release/
mkdir -p /app/deploy/pre-pack/
cp /app/dist/api /app/deploy/pre-pack/unraid-api
cp /app/.env.production /app/deploy/pre-pack/.env.production
cp /app/.env.staging /app/deploy/pre-pack/.env.staging
cp /app/README.md /app/deploy/pre-pack/
cd /app/deploy/pre-pack
npm pack
ls -1 unraid-api-* | xargs -L1 -I{} mv {} /app/deploy/release/{} 
