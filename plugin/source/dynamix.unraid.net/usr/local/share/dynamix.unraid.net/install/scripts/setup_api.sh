#!/bin/bash
# Script to handle API setup

# Setup environment
CONFIG_DIR="/boot/config/plugins/dynamix.my.servers"
API_BASE_DIR="/usr/local/unraid-api"
UNRAID_BINARY_PATH="/usr/local/bin/unraid-api"

echo "Starting API setup script"
echo "Environment: CONFIG_DIR=$CONFIG_DIR, API_BASE_DIR=$API_BASE_DIR"
echo "UNRAID_BINARY_PATH=$UNRAID_BINARY_PATH"

# Set up environment file
if [ ! -f "${CONFIG_DIR}/env" ]; then
  echo "Creating env file at ${CONFIG_DIR}/env"
  mkdir -p "${CONFIG_DIR}"
  echo "env=\"production\"" > "${CONFIG_DIR}/env"
else
  echo "Env file already exists"
fi

# Create symlink for rc0.d to rc6.d if needed
if [ ! -L /etc/rc.d/rc0.d ] && [ ! -d /etc/rc.d/rc0.d ]; then
  echo "Creating symlink from /etc/rc.d/rc0.d to /etc/rc.d/rc6.d"
  ln -s /etc/rc.d/rc6.d /etc/rc.d/rc0.d
fi

echo "API setup completed at $(date)"
