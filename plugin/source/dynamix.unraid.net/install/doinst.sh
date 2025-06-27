#!/bin/sh

backup_file_if_exists() {
  if [ -f "$1" ]; then
    mv "$1" "$1.old"
  fi
}

chmod 755 etc/rc.d/rc6.d/K*unraid-api
chmod 755 etc/rc.d/rc6.d/K*flash-backup

chmod +x usr/local/unraid-api/dist/cli.js
chmod +x usr/local/unraid-api/dist/main.js

rm -rf usr/local/bin/unraid-api
ln -sf usr/local/unraid-api/dist/cli.js usr/local/bin/unraid-api
# deprecated
ln -sf usr/local/bin/unraid-api usr/local/sbin/unraid-api
ln -sf usr/local/bin/unraid-api usr/bin/unraid-api

# By default, we want to overwrite the active api-specific .env configuration on every install.
# We keep a backup in case a user needs to revert to their prior configuration.
backup_file_if_exists usr/local/unraid-api/.env
cp usr/local/unraid-api/.env.production usr/local/unraid-api/.env

# auto-generated actions from makepkg:
