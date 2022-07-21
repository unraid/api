rm -f /app/deploy/**/*

npm run build
npm run build-binary-step-1
mkdir -p ./deploy/release/
mkdir -p ./deploy/pre-pack/
cp ./unraid-api ./deploy/pre-pack/
cp ./package.json ./deploy/pre-pack/
cp ./README.md ./deploy/pre-pack/
cd ./deploy/pre-pack
npm pack
ls -1 unraid-api-* | xargs -L1 -I{} mv {} ../release/{} 
