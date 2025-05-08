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

# Create log directory (PM2 will not start without it)
mkdir -p /var/log/unraid-api
echo "Created log directory at /var/log/unraid-api"

# Create Symlinks for the Unraid API
if [ -f "${API_BASE_DIR}/dist/cli.js" ]; then
  echo "Creating symlinks for unraid-api"
  ln -sf "${API_BASE_DIR}/dist/cli.js" "/usr/local/bin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/local/sbin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/bin/unraid-api"
  
  # Verify symlinks were created
  if [ -L "/usr/local/bin/unraid-api" ]; then
    echo "Symlinks created successfully"
  else
    echo "ERROR: Failed to create symlinks"
  fi
  
  # Make API scripts executable
  echo "Making API scripts executable"
  chmod +x "${API_BASE_DIR}/dist/cli.js"
  chmod +x "${API_BASE_DIR}/dist/main.js"
  echo "API scripts are now executable"
else
  echo "ERROR: Source file ${API_BASE_DIR}/dist/cli.js does not exist"
  
  # Check if the directory exists
  if [ -d "${API_BASE_DIR}" ]; then
    echo "API base directory exists"
    ls -la "${API_BASE_DIR}"
    
    if [ -d "${API_BASE_DIR}/dist" ]; then
      echo "Dist directory exists"
      ls -la "${API_BASE_DIR}/dist"
    else
      echo "Dist directory does not exist"
    fi
  else
    echo "API base directory does not exist"
  fi
fi

# Copy env file
if [ -f "${API_BASE_DIR}/.env.production" ]; then
  echo "Copying .env.production to .env"
  cp "${API_BASE_DIR}/.env.production" "${API_BASE_DIR}/.env"
else
  echo "ERROR: .env.production file not found"
fi

# Restore dependencies using vendor archive from package
if [ -x "/etc/rc.d/rc.unraid-api" ]; then
  echo "Restoring dependencies using auto-detection"
  /etc/rc.d/rc.unraid-api ensure
else
  echo "Dependencies not restored: rc.unraid-api executable not found"
fi

# Ensure rc directories exist and scripts are executable
echo "Ensuring shutdown scripts are executable"
if [ -d "/etc/rc.d/rc6.d" ]; then
  chmod 755 /etc/rc.d/rc6.d/K*unraid-api 2>/dev/null
  chmod 755 /etc/rc.d/rc6.d/K*flash-backup 2>/dev/null
else
  echo "Warning: rc6.d directory does not exist"
fi

# Create symlink for rc0.d to rc6.d if needed
if [ ! -L /etc/rc.d/rc0.d ] && [ ! -d /etc/rc.d/rc0.d ]; then
  echo "Creating symlink from /etc/rc.d/rc0.d to /etc/rc.d/rc6.d"
  ln -s /etc/rc.d/rc6.d /etc/rc.d/rc0.d
fi

echo "API setup completed at $(date)"
