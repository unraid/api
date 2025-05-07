#!/bin/sh
# Script to handle API setup

# Setup environment
CONFIG_DIR="/boot/config/plugins/dynamix.my.servers"
API_BASE_DIR="/usr/local/unraid-api"
UNRAID_BINARY_PATH="/usr/local/bin/unraid-api"
VENDOR_ARCHIVE="${CONFIG_DIR}/packed-node-modules.tar.xz"

# Set up environment file
if [ ! -f "${CONFIG_DIR}/env" ]; then
  echo "env=\"production\"" > "${CONFIG_DIR}/env"
fi

# Create log directory (PM2 will not start without it)
mkdir -p /var/log/unraid-api

# Create Symlinks for the Unraid API
if [ -f usr/local/unraid-api/dist/cli.js ]; then
  ln -sf usr/local/unraid-api/dist/cli.js usr/local/bin/unraid-api
  ln -sf usr/local/bin/unraid-api usr/local/sbin/unraid-api
  ln -sf usr/local/bin/unraid-api usr/bin/unraid-api
fi

# Copy env file
if [ -f "${API_BASE_DIR}/.env.production" ]; then
  cp "${API_BASE_DIR}/.env.production" "${API_BASE_DIR}/.env"
fi

# Restore dependencies if available
if [ -x etc/rc.d/rc.unraid-api ] && [ -f "$VENDOR_ARCHIVE" ]; then
  etc/rc.d/rc.unraid-api restore-dependencies "$VENDOR_ARCHIVE"
fi

# Configure flash backup to stop when the system starts shutting down
if [ ! -d etc/rc.d/rc6.d ]; then
  mkdir -p etc/rc.d/rc6.d
fi

if [ ! -h etc/rc.d/rc0.d ]; then
  ln -sf etc/rc.d/rc6.d etc/rc.d/rc0.d
fi

if [ ! -h etc/rc.d/rc6.d/K10_flash_backup ] && [ -f etc/rc.d/rc.flash_backup ]; then
  ln -sf etc/rc.d/rc.flash_backup etc/rc.d/rc6.d/K10_flash_backup
fi

# Note: Services are no longer started here
# They will be started by the Slackware init system at boot time 