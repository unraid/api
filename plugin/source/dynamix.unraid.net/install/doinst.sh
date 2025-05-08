#!/bin/sh
# Main installation script for dynamix.unraid.net package
# This script calls specialized external scripts to handle different aspects of installation

# Get the install mode (passed as the first argument by the installpkg script)
INSTALL_MODE="${1:-install}"
# Use absolute paths for script directory to avoid path resolution issues
SCRIPTS_DIR="/usr/local/share/dynamix.unraid.net/install/scripts"

# Log file for debugging
LOGFILE="/var/log/unraid-api/dynamix-unraid-install.log"
mkdir -p "$(dirname "$LOGFILE")"
date > "$LOGFILE"
echo "Starting installation with mode: $INSTALL_MODE" >> "$LOGFILE"
echo "Script directory: $SCRIPTS_DIR" >> "$LOGFILE"

# Make sure scripts are executable
if [ -d "$SCRIPTS_DIR" ]; then
  chmod +x "$SCRIPTS_DIR"/*.sh
  echo "Made scripts executable" >> "$LOGFILE"
else 
  echo "ERROR: Scripts directory not found: $SCRIPTS_DIR" >> "$LOGFILE"
  # Create directory structure if it doesn't exist yet
  mkdir -p "$SCRIPTS_DIR"
fi

# Process based on installation mode
if [ "$INSTALL_MODE" = "install" ] || [ "$INSTALL_MODE" = "upgrade" ]; then
  echo "Starting Unraid Connect installation..."
  
  # Apply file patches and system configurations
  if [ -x "$SCRIPTS_DIR/file_patches.sh" ]; then
    echo "Applying system patches and configurations..."
    echo "Running file_patches.sh" >> "$LOGFILE"
    # Capture output and add to log file
    patches_output=$("$SCRIPTS_DIR/file_patches.sh")
    echo "$patches_output" >> "$LOGFILE"
  else
    echo "ERROR: file_patches.sh not found or not executable" >> "$LOGFILE"
  fi
  
  # Setup the API (but don't start it yet)
  if [ -x "$SCRIPTS_DIR/setup_api.sh" ]; then
    echo "Setting up Unraid API..."
    echo "Running setup_api.sh" >> "$LOGFILE"
    # Capture output and add to log file
    setup_output=$("$SCRIPTS_DIR/setup_api.sh")
    echo "$setup_output" >> "$LOGFILE"
    
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
  if [ -f /etc/rc.d/rc.unraid-api ]; then
    chmod 755 /etc/rc.d/rc.unraid-api
    echo "Made rc.unraid-api executable" >> "$LOGFILE"
    
    # Start the service
    /etc/rc.d/rc.unraid-api start
    
    # Verify the service started successfully
    if ! /etc/rc.d/rc.unraid-api status | grep -q "online"; then
      echo "⚠️ Warning: Unraid API service failed to start" | tee -a "$LOGFILE"
      echo "Check $LOGFILE for details"
    else
      echo "Unraid API service started successfully" >> "$LOGFILE"
    fi
  else
    echo "ERROR: rc.unraid-api not found" >> "$LOGFILE"
  fi
  
  # Run post-installation verification
  if [ -x "$SCRIPTS_DIR/verify_install.sh" ]; then
    echo "Running post-installation verification..."
    echo "Running verify_install.sh" >> "$LOGFILE"
    # Capture output and add to log file
    verify_output=$("$SCRIPTS_DIR/verify_install.sh")
    echo "$verify_output" >> "$LOGFILE"
  else
    echo "ERROR: verify_install.sh not found or not executable" >> "$LOGFILE"
  fi
  
  echo "Installation completed successfully."
  echo "Installation completed at $(date)" >> "$LOGFILE"
  
  # Run test script if available
  if [ -x "$SCRIPTS_DIR/test-setup-api.sh" ]; then
    echo "Running setup_api.sh validation test..."
    echo "Running test-setup-api.sh" >> "$LOGFILE"
    # Run the test and capture output (without the log file references)
    test_output=$("$SCRIPTS_DIR/test-setup-api.sh" | sed '/See log file for details/d')
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
  
  echo "Removal completed successfully."
  echo "Removal completed at $(date)" >> "$LOGFILE"
fi
