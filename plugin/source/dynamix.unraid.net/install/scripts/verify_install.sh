#!/bin/sh
# Post-installation verification script
# Checks that critical files are installed correctly

# Exit on errors
set -e

# Define color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "Performing installation verification..."

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
/usr/local/emhttp/plugins/dynamix.unraid.net"

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

# Check executable files
echo "Checking executable files..."
EXEC_ERRORS=0
for file in $CRITICAL_FILES; do
  if ! check_executable "$file"; then
    EXEC_ERRORS=$((EXEC_ERRORS + 1))
  fi
done

# Check directories
echo "Checking directories..."
DIR_ERRORS=0
for dir in $CRITICAL_DIRS; do
  if ! check_dir "$dir"; then
    DIR_ERRORS=$((DIR_ERRORS + 1))
  fi
done

# Check for proper Slackware-style startup configuration
echo "Checking startup configuration..."
STARTUP_CONFIG_OK=1

# Check if rc.M or rc.local files contain unraid-api start command
STARTUP_FOUND=0
for RC_FILE in "/etc/rc.d/rc.M" "/etc/rc.d/rc.local"; do
  if [ -f "$RC_FILE" ] && grep -q "rc.unraid-api start" "$RC_FILE"; then
    printf '%s✓%s File %s contains unraid-api startup command\n' "$GREEN" "$NC" "$RC_FILE"
    STARTUP_FOUND=1
  fi
done

if [ $STARTUP_FOUND -eq 0 ]; then
  printf '%s✗%s No startup configuration found for unraid-api in rc.M or rc.local\n' "$RED" "$NC"
  STARTUP_CONFIG_OK=0
fi

# Check if rc.M or rc.local files contain flash_backup start command
FLASH_BACKUP_STARTUP_FOUND=0
for RC_FILE in "/etc/rc.d/rc.M" "/etc/rc.d/rc.local"; do
  if [ -f "$RC_FILE" ] && grep -q "rc.flash_backup start" "$RC_FILE"; then
    printf '%s✓%s File %s contains flash_backup startup command\n' "$GREEN" "$NC" "$RC_FILE"
    FLASH_BACKUP_STARTUP_FOUND=1
  fi
done

if [ $FLASH_BACKUP_STARTUP_FOUND -eq 0 ] && [ -f "/etc/rc.d/rc.flash_backup" ]; then
  printf '%s✗%s No startup configuration found for flash_backup in rc.M or rc.local\n' "$RED" "$NC"
  STARTUP_CONFIG_OK=0
fi

if [ $STARTUP_CONFIG_OK -eq 0 ]; then
  EXEC_ERRORS=$((EXEC_ERRORS + 1))
fi

# Check for proper Slackware-style shutdown configuration
echo "Checking shutdown configuration..."
SHUTDOWN_CONFIG_OK=1

# Check if rc.0 and rc.6 files contain flash_backup stop command
if [ -f "/etc/rc.d/rc.flash_backup" ]; then
  for RC_FILE in "/etc/rc.d/rc.0" "/etc/rc.d/rc.6"; do
    if [ -f "$RC_FILE" ] && grep -q "rc.flash_backup stop" "$RC_FILE"; then
      printf '%s✓%s File %s contains flash backup stop command\n' "$GREEN" "$NC" "$RC_FILE"
    else
      printf '%s✗%s File %s missing or does not contain flash backup stop command\n' "$RED" "$NC" "$RC_FILE"
      SHUTDOWN_CONFIG_OK=0
    fi
  done
fi

# Check if unraid-api shutdown is properly configured in Slackware runlevels
for RC_FILE in "/etc/rc.d/rc.0" "/etc/rc.d/rc.6"; do
  if [ -f "$RC_FILE" ] && grep -q "rc.unraid-api stop" "$RC_FILE"; then
    printf '%s✓%s File %s contains unraid-api stop command\n' "$GREEN" "$NC" "$RC_FILE"
  else
    printf '%s✗%s File %s missing or does not contain unraid-api stop command\n' "$RED" "$NC" "$RC_FILE"
    SHUTDOWN_CONFIG_OK=0
  fi
done

if [ $SHUTDOWN_CONFIG_OK -eq 0 ]; then
  EXEC_ERRORS=$((EXEC_ERRORS + 1))
fi

# Check if unraid-api is in path
if command -v unraid-api >/dev/null 2>&1; then
  printf '%s✓%s unraid-api is in PATH\n' "$GREEN" "$NC"
else
  printf '%s⚠%s unraid-api is not in PATH\n' "$YELLOW" "$NC"
fi

# Summary
echo ""
echo "Verification summary:"
if [ $EXEC_ERRORS -eq 0 ] && [ $DIR_ERRORS -eq 0 ]; then
  printf '%sAll critical files and directories are present.%s\n' "$GREEN" "$NC"
  echo "Installation verification passed."
  exit 0
else
  printf '%sFound %d file errors and %d directory errors.%s\n' "$RED" "$EXEC_ERRORS" "$DIR_ERRORS" "$NC"
  echo "Installation verification completed with issues."
  # We don't exit with error as this is just a verification script
  exit 0
fi 