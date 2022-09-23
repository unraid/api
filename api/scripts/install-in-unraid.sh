GIT_SHA_SHORT=$(git rev-parse --short HEAD)
VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
cp ./deploy/release/unraid-api-${VERSION}+${GIT_SHA_SHORT}.tgz /boot/config/plugins/dynamix.my.servers/ && /etc/rc.d/rc.unraid-api _install unraid-api-${VERSION}+${GIT_SHA_SHORT}.tgz
