npm run build
npm run build-binary-step-1
mkdir -p ./deploy/release/
mkdir -p ./deploy/pre-pack/
cp /app/unraid-api ./deploy/pre-pack/
cp /app/package.json ./deploy/pre-pack/
cp /app/README.md ./deploy/pre-pack/
cd /app/deploy/pre-pack
npm pack
mv /app/deploy/pre-pack/unraid-api-* /app/deploy/release/