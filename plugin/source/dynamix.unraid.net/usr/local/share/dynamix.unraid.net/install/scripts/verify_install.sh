#!/bin/sh
# Unraid API Installation Verification Script
# Checks that critical files are installed correctly

# Exit on errors
set -e

# Define color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "Performing comprehensive installation verification..."

# Define critical files to check (POSIX-compliant, no arrays)
CRITICAL_FILES="/usr/local/bin/unraid-api 
/etc/rc.d/rc.unraid-api
/usr/local/emhttp/plugins/dynamix.my.servers/scripts/gitflash_log
/usr/local/share/dynamix.unraid.net/install/scripts/cleanup.sh
/usr/local/share/dynamix.unraid.net/install/scripts/file_patches.sh
/usr/local/share/dynamix.unraid.net/install/scripts/setup_api.sh"

# Define critical directories to check (POSIX-compliant, no arrays)
CRITICAL_DIRS="/usr/local/unraid-api
/var/log/unraid-api
/usr/local/emhttp/plugins/dynamix.my.servers
/usr/local/emhttp/plugins/dynamix.unraid.net
/etc/rc.d/rc6.d
/etc/rc.d/rc0.d"

# Define critical symlinks to check
CRITICAL_SYMLINKS="/usr/local/bin/unraid-api
/usr/local/sbin/unraid-api
/usr/bin/unraid-api"

# Track total errors
TOTAL_ERRORS=0

# Function to check if file exists and is executable
check_executable() {
  if [ -x "$1" ]; then
    printf '%s✓%s Executable file %s exists and is executable\n' "$GREEN" "$NC" "$1"
    return 0
  elif [ -f "$1" ]; then
    printf '%s⚠%s File %s exists but is not executable\n' "$YELLOW" "$NC" "$1"
    return 1
  else
    printf '%s✗%s Executable file %s is missing\n' "$RED" "$NC" "$1"
    return 2
  fi
}

# Function to check if directory exists
check_dir() {
  if [ -d "$1" ]; then
    printf '%s✓%s Directory %s exists\n' "$GREEN" "$NC" "$1"
    return 0
  else
    printf '%s✗%s Directory %s is missing\n' "$RED" "$NC" "$1"
    return 1
  fi
}

# Function to check symlinks
check_symlink() {
  if [ -L "$1" ]; then
    printf '%s✓%s Symlink %s exists -> %s\n' "$GREEN" "$NC" "$1" "$(readlink "$1")"
    return 0
  else
    printf '%s✗%s Symlink %s is missing\n' "$RED" "$NC" "$1"
    return 1
  fi
}

# Check executable files
echo "Checking executable files..."
EXEC_ERRORS=0
for file in $CRITICAL_FILES; do
  if ! check_executable "$file"; then
    EXEC_ERRORS=$((EXEC_ERRORS + 1))
  fi
done
TOTAL_ERRORS=$((TOTAL_ERRORS + EXEC_ERRORS))

# Check directories
echo "Checking directories..."
DIR_ERRORS=0
for dir in $CRITICAL_DIRS; do
  if ! check_dir "$dir"; then
    DIR_ERRORS=$((DIR_ERRORS + 1))
  fi
done
TOTAL_ERRORS=$((TOTAL_ERRORS + DIR_ERRORS))

# Check symlinks
echo "Checking symlinks..."
SYMLINK_ERRORS=0
for link in $CRITICAL_SYMLINKS; do
  if ! check_symlink "$link"; then
    SYMLINK_ERRORS=$((SYMLINK_ERRORS + 1))
  fi
done
TOTAL_ERRORS=$((TOTAL_ERRORS + SYMLINK_ERRORS))

# Check environment file
ENV_FILE="/boot/config/plugins/dynamix.my.servers/env"
echo "Checking configuration files..."
CONFIG_ERRORS=0
if [ -f "$ENV_FILE" ]; then
  printf '%s✓%s Environment file %s exists\n' "$GREEN" "$NC" "$ENV_FILE"
else
  printf '%s✗%s Environment file %s is missing\n' "$RED" "$NC" "$ENV_FILE"
  CONFIG_ERRORS=$((CONFIG_ERRORS + 1))
fi
TOTAL_ERRORS=$((TOTAL_ERRORS + CONFIG_ERRORS))

# Check for proper Slackware-style startup configuration
echo "Checking startup configuration..."
STARTUP_ERRORS=0

# Check if rc.M or rc.local files contain unraid-api start command
STARTUP_FOUND=0
for RC_FILE in "/etc/rc.d/rc.M" "/etc/rc.d/rc.local"; do
  if [ -f "$RC_FILE" ] && grep -q "rc.unraid-api" "$RC_FILE"; then
    printf '%s✓%s File %s contains unraid-api startup command\n' "$GREEN" "$NC" "$RC_FILE"
    STARTUP_FOUND=1
  fi
done

if [ $STARTUP_FOUND -eq 0 ]; then
  printf '%s✗%s No startup configuration found for unraid-api in rc.M or rc.local\n' "$RED" "$NC"
  STARTUP_ERRORS=$((STARTUP_ERRORS + 1))
fi

# Check if rc.M or rc.local files contain flash_backup start command
if [ -f "/etc/rc.d/rc.flash_backup" ]; then
  FLASH_BACKUP_STARTUP_FOUND=0
  for RC_FILE in "/etc/rc.d/rc.M" "/etc/rc.d/rc.local"; do
    if [ -f "$RC_FILE" ] && grep -q "rc.flash_backup" "$RC_FILE"; then
      printf '%s✓%s File %s contains flash_backup startup command\n' "$GREEN" "$NC" "$RC_FILE"
      FLASH_BACKUP_STARTUP_FOUND=1
    fi
  done

  if [ $FLASH_BACKUP_STARTUP_FOUND -eq 0 ]; then
    printf '%s✗%s No startup configuration found for flash_backup in rc.M or rc.local\n' "$RED" "$NC"
    STARTUP_ERRORS=$((STARTUP_ERRORS + 1))
  fi
fi
TOTAL_ERRORS=$((TOTAL_ERRORS + STARTUP_ERRORS))

# Check for proper Slackware-style shutdown configuration
echo "Checking shutdown configuration..."
SHUTDOWN_ERRORS=0

# Check for package-provided shutdown scripts in rc6.d directory
echo "Checking for shutdown scripts in rc6.d..."
if [ -f "/etc/rc.d/rc.flash_backup" ]; then
  if [ -x "/etc/rc.d/rc6.d/K10flash_backup" ]; then
    printf '%s✓%s Shutdown script for flash_backup exists and is executable\n' "$GREEN" "$NC"
  else
    printf '%s✗%s Shutdown script for flash_backup missing or not executable\n' "$RED" "$NC"
    SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
  fi
fi

# Check for unraid-api shutdown script
if [ -x "/etc/rc.d/rc6.d/K20unraid-api" ]; then
  printf '%s✓%s Shutdown script for unraid-api exists and is executable\n' "$GREEN" "$NC"
else
  printf '%s✗%s Shutdown script for unraid-api missing or not executable\n' "$RED" "$NC"
  SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
fi

# Check for rc0.d symlink or directory
if [ -L "/etc/rc.d/rc0.d" ]; then
  printf '%s✓%s rc0.d symlink exists\n' "$GREEN" "$NC"
elif [ -d "/etc/rc.d/rc0.d" ]; then
  printf '%s✓%s rc0.d directory exists\n' "$GREEN" "$NC"
else
  printf '%s✗%s rc0.d symlink or directory missing\n' "$RED" "$NC"
  SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
fi

# Check specific runlevel scripts for rc.0 and rc.6
for RCFILE in "/etc/rc.d/rc.0" "/etc/rc.d/rc.6"; do
  if [ -f "$RCFILE" ] && grep -q "rc.unraid-api" "$RCFILE"; then
    printf '%s✓%s rc.unraid-api entry found in %s\n' "$GREEN" "$NC" "$RCFILE"
  else
    printf '%s✗%s rc.unraid-api entry not found in %s\n' "$RED" "$NC" "$RCFILE"
    SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
  fi
done
TOTAL_ERRORS=$((TOTAL_ERRORS + SHUTDOWN_ERRORS))

# Check if unraid-api is in path
if command -v unraid-api >/dev/null 2>&1; then
  printf '%s✓%s unraid-api is in PATH\n' "$GREEN" "$NC"
else
  printf '%s⚠%s unraid-api is not in PATH\n' "$YELLOW" "$NC"
  TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

# Log file check
if [ -f "/var/log/unraid-api/dynamix-unraid-install.log" ]; then
  printf '%s✓%s Installation log file exists\n' "$GREEN" "$NC"
else
  printf '%s⚠%s Installation log file not found\n' "$YELLOW" "$NC"
fi

# Summary
echo ""
echo "Verification summary:"
echo "- Executable files errors: $EXEC_ERRORS"
echo "- Directory errors: $DIR_ERRORS"
echo "- Symlink errors: $SYMLINK_ERRORS"
echo "- Configuration errors: $CONFIG_ERRORS"
echo "- Startup configuration errors: $STARTUP_ERRORS"
echo "- Shutdown configuration errors: $SHUTDOWN_ERRORS"
echo "- Total errors: $TOTAL_ERRORS"

if [ $TOTAL_ERRORS -eq 0 ]; then
  printf '%sAll checks passed successfully.%s\n' "$GREEN" "$NC"
  echo "Installation verification completed successfully."
  exit 0
else
  printf '%sFound %d total errors.%s\n' "$RED" "$TOTAL_ERRORS" "$NC"
  echo "Installation verification completed with issues."
  echo "See log file for details: /var/log/unraid-api/dynamix-unraid-install.log"
  # We don't exit with error as this is just a verification script
  exit 0
fi 