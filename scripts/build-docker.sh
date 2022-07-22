rm -f /app/deploy/**/**/*

npm run build
npm run clean
/app/scripts/copy-full-version.sh
npm run build-binary-step-1
mkdir -p /app/deploy/release/
mkdir -p /app/deploy/pre-pack/
cp /app/unraid-api /app/deploy/pre-pack/
cp /app/package-deployment.json /app/deploy/pre-pack/package.json
cp /app/README.md /app/deploy/pre-pack/
cd /app/deploy/pre-pack
npm pack
ls -1 unraid-api-* | xargs -L1 -I{} mv {} ../release/{} 
