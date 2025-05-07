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
if [ -f "${API_BASE_DIR}/dist/cli.js" ]; then
  ln -sf "${API_BASE_DIR}/dist/cli.js" "/usr/local/bin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/local/sbin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/bin/unraid-api"
fi

# Copy env file
if [ -f "${API_BASE_DIR}/.env.production" ]; then
  cp "${API_BASE_DIR}/.env.production" "${API_BASE_DIR}/.env"
fi

# Restore dependencies if available
if [ -x "/etc/rc.d/rc.unraid-api" ] && [ -f "$VENDOR_ARCHIVE" ]; then
  /etc/rc.d/rc.unraid-api restore-dependencies "$VENDOR_ARCHIVE"
fi

# Helper function to configure startup/shutdown scripts
configure_script() {
  # Check if the file exists, if not create it with basic structure
  if [ ! -f "$1" ]; then
    echo "#!/bin/sh" > "$1"
    echo "# $1 - run once at $5" >> "$1"
    chmod 755 "$1"
  fi
  
  # Add command to file if not already there
  if ! grep -q "$2 $4" "$1"; then
    # For startup scripts (rc.M, rc.local), add command at the end
    if [ "$4" = "start" ]; then
      echo "" >> "$1"
      echo "# $3" >> "$1"
      echo "if [ -x $2 ]; then" >> "$1"
      echo "  $2 $4" >> "$1"
      echo "fi" >> "$1"
      echo "Added $2 $4 command to $1"
    else
      # For shutdown scripts (rc.0, rc.6), add command near beginning
      sed -i "10i# $3\nif [ -x $2 ]; then\n  $2 $4\nfi\n" "$1"
      echo "Added $2 $4 command to $1"
    fi
  else
    echo "$2 $4 command already exists in $1"
  fi
}

# Configure startup for unraid-api
if [ -f "/etc/rc.d/rc.unraid-api" ]; then
  # Configure for runlevel 3 (multi-user mode, standard Slackware default)
  # Slackware uses rc.M for runlevel 3 (multi-user mode)
  configure_script "/etc/rc.d/rc.M" "/etc/rc.d/rc.unraid-api" "Start Unraid API service" "start" "multi-user startup"
  
  # Also add to rc.local as a fallback 
  configure_script "/etc/rc.d/rc.local" "/etc/rc.d/rc.unraid-api" "Start Unraid API service" "start" "local startup"
  
  # Configure unraid-api shutdown in rc.0 and rc.6
  configure_script "/etc/rc.d/rc.0" "/etc/rc.d/rc.unraid-api" "Stop Unraid API service" "stop" "shutdown"
  configure_script "/etc/rc.d/rc.6" "/etc/rc.d/rc.unraid-api" "Stop Unraid API service" "stop" "reboot"
fi

# Setup flash backup service
if [ -f "/etc/rc.d/rc.flash_backup" ]; then
  # Configure flash_backup startup
  configure_script "/etc/rc.d/rc.M" "/etc/rc.d/rc.flash_backup" "Start flash backup service" "start" "multi-user startup"
  configure_script "/etc/rc.d/rc.local" "/etc/rc.d/rc.flash_backup" "Start flash backup service" "start" "local startup"
  
  # Configure flash_backup shutdown in rc.0 and rc.6
  configure_script "/etc/rc.d/rc.0" "/etc/rc.d/rc.flash_backup" "Stop flash backup service" "stop" "shutdown"
  configure_script "/etc/rc.d/rc.6" "/etc/rc.d/rc.flash_backup" "Stop flash backup service" "stop" "reboot"
fi
