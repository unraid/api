#!/bin/sh
# Main installation script for dynamix.unraid.net package
# This script calls specialized external scripts to handle different aspects of installation

# Get the install mode (passed as the first argument by the installpkg script)
INSTALL_MODE="${1:-install}"
# Use absolute paths for script directory to avoid path resolution issues
SCRIPTS_DIR="/usr/local/share/dynamix.unraid.net/install/scripts"

# Log file for debugging
LOGFILE="/tmp/dynamix-unraid-install.log"
date > "$LOGFILE"
echo "Starting installation with mode: $INSTALL_MODE" >> "$LOGFILE"
echo "Script directory: $SCRIPTS_DIR" >> "$LOGFILE"

# Make sure scripts are executable
if [ -d $SCRIPTS_DIR ]; then
  chmod +x $SCRIPTS_DIR/*.sh
  echo "Made scripts executable" >> "$LOGFILE"
else 
  echo "ERROR: Scripts directory not found: $SCRIPTS_DIR" >> "$LOGFILE"
  # Create directory structure if it doesn't exist yet
  mkdir -p $SCRIPTS_DIR
fi

# Handle file restoration for both installation and removal
if [ -x $SCRIPTS_DIR/cleanup.sh ]; then
  # This is needed for both install and remove to ensure file restoration works correctly
  touch /tmp/restore-files-dynamix-unraid-net
  echo "Restoring files if needed..."
  echo "Running cleanup.sh restore" >> "$LOGFILE"
  $SCRIPTS_DIR/cleanup.sh restore
else
  echo "ERROR: cleanup.sh not found or not executable" >> "$LOGFILE"
fi

# Process based on installation mode
if [ "$INSTALL_MODE" = "install" ] || [ "$INSTALL_MODE" = "upgrade" ]; then
  echo "Starting Unraid Connect installation..."
  
  # Apply file patches and system configurations
  if [ -x $SCRIPTS_DIR/file_patches.sh ]; then
    echo "Applying system patches and configurations..."
    echo "Running file_patches.sh" >> "$LOGFILE"
    $SCRIPTS_DIR/file_patches.sh
  else
    echo "ERROR: file_patches.sh not found or not executable" >> "$LOGFILE"
  fi
  
  # Setup the API (but don't start it yet)
  if [ -x $SCRIPTS_DIR/setup_api.sh ]; then
    echo "Setting up Unraid API..."
    echo "Running setup_api.sh" >> "$LOGFILE"
    $SCRIPTS_DIR/setup_api.sh
    
    # Verify symlinks were created
    if [ -L "/usr/local/bin/unraid-api" ]; then
      echo "Symlink created successfully" >> "$LOGFILE"
    else
      echo "ERROR: Symlink not created, attempting to create manually" >> "$LOGFILE"
      # Create the symlink manually as fallback
      if [ -f "/usr/local/unraid-api/dist/cli.js" ]; then
        ln -sf "/usr/local/unraid-api/dist/cli.js" "/usr/local/bin/unraid-api"
        ln -sf "/usr/local/bin/unraid-api" "/usr/local/sbin/unraid-api"
        ln -sf "/usr/local/bin/unraid-api" "/usr/bin/unraid-api"
        echo "Manually created symlinks" >> "$LOGFILE"
      else
        echo "ERROR: Source file for symlink not found" >> "$LOGFILE"
      fi
    fi
  else
    echo "ERROR: setup_api.sh not found or not executable" >> "$LOGFILE"
  fi
  
  # Make the rc script executable
  if [ -f etc/rc.d/rc.unraid-api ]; then
    chmod 755 etc/rc.d/rc.unraid-api
    echo "Made rc.unraid-api executable" >> "$LOGFILE"
    
    # NOTE: For proper Slackware package integration, we should eventually
    # implement proper service startup rather than relying on the .plg file.
    # Options include:
    # 1. Adding to /boot/config/go for Unraid-specific startup
    # 2. Using native systemd service files if Unraid supports them
    # 3. Following the standard Unraid service pattern seen in their core services
    # For now, we'll use the .plg file's post-install sections to start the service
  else
    echo "ERROR: rc.unraid-api not found" >> "$LOGFILE"
  fi
  
  # Run post-installation verification
  if [ -x $SCRIPTS_DIR/verify_install.sh ]; then
    echo "Running post-installation verification..."
    echo "Running verify_install.sh" >> "$LOGFILE"
    $SCRIPTS_DIR/verify_install.sh
  else
    echo "ERROR: verify_install.sh not found or not executable" >> "$LOGFILE"
  fi
  
  echo "Installation completed successfully."
  echo "Installation completed at $(date)" >> "$LOGFILE"
  
  # Run test script if available
  if [ -x $SCRIPTS_DIR/test-setup-api.sh ]; then
    echo "Running setup_api.sh validation test..."
    echo "Running test-setup-api.sh" >> "$LOGFILE"
    # Run the test and capture output
    test_output=$($SCRIPTS_DIR/test-setup-api.sh)
    echo "$test_output" >> "$LOGFILE"
    # Extract just the summary of failed tests
    failed_tests=$(echo "$test_output" | grep "✗" || true)
    if [ -n "$failed_tests" ]; then
      echo "Warning: Some tests failed:" >> "$LOGFILE"
      echo "$failed_tests" >> "$LOGFILE"
      # Try to fix symlinks if they're missing
      if echo "$failed_tests" | grep -q "Symlink not created"; then
        echo "Attempting to fix missing symlinks..." >> "$LOGFILE"
        if [ -f "/usr/local/unraid-api/dist/cli.js" ]; then
          ln -sf "/usr/local/unraid-api/dist/cli.js" "/usr/local/bin/unraid-api"
          ln -sf "/usr/local/bin/unraid-api" "/usr/local/sbin/unraid-api"
          ln -sf "/usr/local/bin/unraid-api" "/usr/bin/unraid-api"
          echo "Manual symlink creation completed" >> "$LOGFILE"
        else
          echo "ERROR: Cannot create symlinks - source file not found" >> "$LOGFILE"
        fi
      fi
    else
      echo "All tests passed successfully" >> "$LOGFILE"
    fi
  else
    echo "Test script not found or not executable" >> "$LOGFILE"
  fi
  
elif [ "$INSTALL_MODE" = "remove" ]; then
  echo "Starting Unraid Connect removal..."
  echo "Starting removal" >> "$LOGFILE"
  
  # Run cleanup operations
  if [ -x $SCRIPTS_DIR/cleanup.sh ]; then
    echo "Running cleanup operations..."
    echo "Running cleanup.sh cleanup" >> "$LOGFILE"
    $SCRIPTS_DIR/cleanup.sh cleanup
  else
    echo "ERROR: cleanup.sh not found or not executable for removal" >> "$LOGFILE"
  fi
  
  echo "Removal completed successfully."
  echo "Removal completed at $(date)" >> "$LOGFILE"
fi
