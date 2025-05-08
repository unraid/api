#!/bin/sh
# Test script to validate setup_api.sh functionality

echo "==== Running setup_api.sh validation test ===="

# Paths to check
SETUP_SCRIPT="/usr/local/share/dynamix.unraid.net/install/scripts/setup_api.sh"
BINARY_PATH="/usr/local/bin/unraid-api"
RC_SCRIPT="/etc/rc.d/rc.unraid-api"
ENV_FILE="/boot/config/plugins/dynamix.my.servers/env"

# Check if setup script exists
if [ -f "$SETUP_SCRIPT" ]; then
  echo "✓ Setup script exists: $SETUP_SCRIPT"
else
  echo "✗ Setup script not found at: $SETUP_SCRIPT"
  exit 1
fi

# Check if setup script is executable
if [ -x "$SETUP_SCRIPT" ]; then
  echo "✓ Setup script is executable"
else
  echo "✗ Setup script is not executable"
  chmod +x "$SETUP_SCRIPT"
  echo "  Made script executable"
fi

# Run the setup script
echo "Running setup_api.sh..."
"$SETUP_SCRIPT"

# Check for key files
echo "Checking for key files created by setup_api.sh:"

# Check symlinks
if [ -L "$BINARY_PATH" ]; then
  echo "✓ Symlink created: $BINARY_PATH -> $(readlink $BINARY_PATH)"
else
  echo "✗ Symlink not created: $BINARY_PATH"
fi

if [ -L "/usr/local/sbin/unraid-api" ]; then
  echo "✓ Symlink created: /usr/local/sbin/unraid-api -> $(readlink /usr/local/sbin/unraid-api)"
else
  echo "✗ Symlink not created: /usr/local/sbin/unraid-api"
fi

if [ -L "/usr/bin/unraid-api" ]; then
  echo "✓ Symlink created: /usr/bin/unraid-api -> $(readlink /usr/bin/unraid-api)"
else
  echo "✗ Symlink not created: /usr/bin/unraid-api"
fi

# Check if env file exists
if [ -f "$ENV_FILE" ]; then
  echo "✓ Environment file exists: $ENV_FILE"
else
  echo "✗ Environment file not created: $ENV_FILE"
fi

# Check if log directory exists
if [ -d "/var/log/unraid-api" ]; then
  echo "✓ Log directory exists: /var/log/unraid-api"
else
  echo "✗ Log directory not created: /var/log/unraid-api"
fi

# Check if startup/shutdown configurations were added
for RCFILE in "/etc/rc.d/rc.M" "/etc/rc.d/rc.local" "/etc/rc.d/rc.0" "/etc/rc.d/rc.6"; do
  if [ -f "$RCFILE" ] && grep -q "rc.unraid-api" "$RCFILE"; then
    echo "✓ rc.unraid-api entry found in $RCFILE"
  else
    echo "✗ rc.unraid-api entry not found in $RCFILE"
  fi
done

echo "==== Validation test completed ===="
echo "See log file for details:"
echo " - /var/log/unraid-api/dynamix-unraid-install.log" 