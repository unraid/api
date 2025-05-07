#!/bin/sh
# Script to handle API setup

# Debug logging
LOGFILE="/tmp/setup-api.log"
date > "$LOGFILE"
echo "Starting API setup script" >> "$LOGFILE"

# Setup environment
CONFIG_DIR="/boot/config/plugins/dynamix.my.servers"
API_BASE_DIR="/usr/local/unraid-api"
UNRAID_BINARY_PATH="/usr/local/bin/unraid-api"

echo "Environment: CONFIG_DIR=$CONFIG_DIR, API_BASE_DIR=$API_BASE_DIR" >> "$LOGFILE"
echo "UNRAID_BINARY_PATH=$UNRAID_BINARY_PATH" >> "$LOGFILE"

# Get API version from Slackware package
# Look for dynamix.unraid.net package in /var/log/packages
pkg_file=""
for f in /var/log/packages/dynamix.unraid.net-*; do
  # Check if the file exists and is not a wildcard pattern (if no matches found)
  if [ -f "$f" ]; then
    pkg_file="$f"
    break
  fi
done

if [ -n "$pkg_file" ]; then
  # Extract version from filename (format: name-version-arch-build)
  pkg_basename=$(basename "$pkg_file")
  api_version=$(echo "$pkg_basename" | cut -d'-' -f2)
  echo "Found API version from Slackware package: $api_version" >> "$LOGFILE"
  
  # Also log package details for debugging
  echo "Package details:" >> "$LOGFILE"
  echo "  Full path: $pkg_file" >> "$LOGFILE"
  echo "  Package name: $pkg_basename" >> "$LOGFILE"
  echo "  Extracted version: $api_version" >> "$LOGFILE"
  
  # Verify version format
  if ! echo "$api_version" | grep -qE "^[0-9]+\.[0-9]+\.[0-9]+"; then
    echo "WARNING: Extracted version doesn't match expected format: $api_version" >> "$LOGFILE"
  fi
else
  echo "ERROR: No dynamix.unraid.net Slackware package found in /var/log/packages" >> "$LOGFILE"
  # List available packages for debugging
  echo "Available packages:" >> "$LOGFILE"
  for pkg in /var/log/packages/*unraid*; do
    if [ -f "$pkg" ]; then
      echo "  $(basename "$pkg")" >> "$LOGFILE"
    fi
  done
  if [ ! -f "/var/log/packages/*unraid*" ]; then
    echo "  No matching packages found" >> "$LOGFILE"
  fi
  exit 1
fi

# Log the final API version
echo "Using API version: $api_version" >> "$LOGFILE"

# Set up environment file
if [ ! -f "${CONFIG_DIR}/env" ]; then
  echo "Creating env file at ${CONFIG_DIR}/env" >> "$LOGFILE"
  mkdir -p "${CONFIG_DIR}"
  echo "env=\"production\"" > "${CONFIG_DIR}/env"
else
  echo "Env file already exists" >> "$LOGFILE"
fi

# Create log directory (PM2 will not start without it)
mkdir -p /var/log/unraid-api
echo "Created log directory at /var/log/unraid-api" >> "$LOGFILE"

# Create Symlinks for the Unraid API
if [ -f "${API_BASE_DIR}/dist/cli.js" ]; then
  echo "Creating symlinks for unraid-api" >> "$LOGFILE"
  ln -sf "${API_BASE_DIR}/dist/cli.js" "/usr/local/bin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/local/sbin/unraid-api"
  ln -sf "/usr/local/bin/unraid-api" "/usr/bin/unraid-api"
  
  # Verify symlinks were created
  if [ -L "/usr/local/bin/unraid-api" ]; then
    echo "Symlinks created successfully" >> "$LOGFILE"
  else
    echo "ERROR: Failed to create symlinks" >> "$LOGFILE"
  fi
else
  echo "ERROR: Source file ${API_BASE_DIR}/dist/cli.js does not exist" >> "$LOGFILE"
  
  # Check if the directory exists
  if [ -d "${API_BASE_DIR}" ]; then
    echo "API base directory exists" >> "$LOGFILE"
    ls -la "${API_BASE_DIR}" >> "$LOGFILE"
    
    if [ -d "${API_BASE_DIR}/dist" ]; then
      echo "Dist directory exists" >> "$LOGFILE"
      ls -la "${API_BASE_DIR}/dist" >> "$LOGFILE"
    else
      echo "Dist directory does not exist" >> "$LOGFILE"
    fi
  else
    echo "API base directory does not exist" >> "$LOGFILE"
  fi
fi

# Copy env file
if [ -f "${API_BASE_DIR}/.env.production" ]; then
  echo "Copying .env.production to .env" >> "$LOGFILE"
  cp "${API_BASE_DIR}/.env.production" "${API_BASE_DIR}/.env"
else
  echo "ERROR: .env.production file not found" >> "$LOGFILE"
fi

# Restore dependencies using vendor archive from package
VENDOR_ARCHIVE="${CONFIG_DIR}/node_modules-for-v${api_version}.tar.xz"
if [ -x "/etc/rc.d/rc.unraid-api" ] && [ -f "$VENDOR_ARCHIVE" ]; then
  echo "Restoring dependencies from vendor archive: $VENDOR_ARCHIVE" >> "$LOGFILE"
  /etc/rc.d/rc.unraid-api restore-dependencies "$VENDOR_ARCHIVE"
else
  echo "Dependencies not restored: rc.unraid-api executable: $( [ -x "/etc/rc.d/rc.unraid-api" ] && echo "Yes" || echo "No" )" >> "$LOGFILE"
  echo "Dependencies not restored: vendor archive exists: $( [ -f "$VENDOR_ARCHIVE" ] && echo "Yes" || echo "No" )" >> "$LOGFILE"
fi

# Helper function to configure startup/shutdown scripts
configure_script() {
  echo "Configuring script $1 for $3 ($5)" >> "$LOGFILE"
  
  # Check if the file exists, if not create it with basic structure
  if [ ! -f "$1" ]; then
    echo "Creating script file $1" >> "$LOGFILE"
    echo "#!/bin/sh" > "$1"
    echo "# $1 - run once at $5" >> "$1"
    chmod 755 "$1"
  fi
  
  # Add command to file if not already there
  if ! grep -q "$2 $4" "$1"; then
    echo "Adding $2 $4 command to $1" >> "$LOGFILE"
    # For startup scripts (rc.M, rc.local), add command at the end
    if [ "$4" = "start" ]; then
      echo "" >> "$1"
      echo "# $3" >> "$1"
      echo "if [ -x $2 ]; then" >> "$1"
      echo "  $2 $4" >> "$1"
      echo "fi" >> "$1"
      echo "Added $2 $4 command to $1" >> "$LOGFILE"
    else
      # For shutdown scripts (rc.0, rc.6), add command near beginning
      sed -i "10i# $3\nif [ -x $2 ]; then\n  $2 $4\nfi\n" "$1"
      echo "Added $2 $4 command to $1" >> "$LOGFILE"
    fi
  else
    echo "$2 $4 command already exists in $1" >> "$LOGFILE"
  fi
}

# Configure startup for unraid-api
if [ -f "/etc/rc.d/rc.unraid-api" ]; then
  echo "Configuring startup for unraid-api" >> "$LOGFILE"
  # Configure for runlevel 3 (multi-user mode, standard Slackware default)
  # Slackware uses rc.M for runlevel 3 (multi-user mode)
  configure_script "/etc/rc.d/rc.M" "/etc/rc.d/rc.unraid-api" "Start Unraid API service" "start" "multi-user startup"
  
  # Also add to rc.local as a fallback 
  configure_script "/etc/rc.d/rc.local" "/etc/rc.d/rc.unraid-api" "Start Unraid API service" "start" "local startup"
  
  # Configure unraid-api shutdown in rc.0 and rc.6
  configure_script "/etc/rc.d/rc.0" "/etc/rc.d/rc.unraid-api" "Stop Unraid API service" "stop" "shutdown"
  configure_script "/etc/rc.d/rc.6" "/etc/rc.d/rc.unraid-api" "Stop Unraid API service" "stop" "reboot"
else
  echo "ERROR: rc.unraid-api not found" >> "$LOGFILE"
fi

# Setup flash backup service
if [ -f "/etc/rc.d/rc.flash_backup" ]; then
  echo "Configuring startup for flash_backup" >> "$LOGFILE"
  # Configure flash_backup startup
  configure_script "/etc/rc.d/rc.M" "/etc/rc.d/rc.flash_backup" "Start flash backup service" "start" "multi-user startup"
  configure_script "/etc/rc.d/rc.local" "/etc/rc.d/rc.flash_backup" "Start flash backup service" "start" "local startup"
  
  # Configure flash_backup shutdown in rc.0 and rc.6
  configure_script "/etc/rc.d/rc.0" "/etc/rc.d/rc.flash_backup" "Stop flash backup service" "stop" "shutdown"
  configure_script "/etc/rc.d/rc.6" "/etc/rc.d/rc.flash_backup" "Stop flash backup service" "stop" "reboot"
else
  echo "flash_backup script not found" >> "$LOGFILE"
fi

# Create a file with the API version for reference
echo "Writing API version to ${CONFIG_DIR}/api_version" >> "$LOGFILE"
echo "$api_version" > "${CONFIG_DIR}/api_version"

echo "API setup completed at $(date)" >> "$LOGFILE"
