GIT_SHA_SHORT=$(git rev-parse --short HEAD)
cp ./deploy/release/unraid-api-2.50.0+${GIT_SHA_SHORT}.tgz /boot/config/plugins/dynamix.my.servers/ && /etc/rc.d/rc.unraid-api _install unraid-api-2.50.0+${GIT_SHA_SHORT}.tgz
