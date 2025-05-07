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

# Check init script symlinks
echo "Checking init script symlinks..."
if [ -L "/etc/rc.d/rc3.d/S99unraid-api" ]; then
  printf '%s✓%s Init script symlink for startup exists\n' "$GREEN" "$NC"
else
  printf '%s✗%s Init script symlink for startup is missing\n' "$RED" "$NC"
  EXEC_ERRORS=$((EXEC_ERRORS + 1))
fi

if [ -L "/etc/rc.d/rc0.d/K01unraid-api" ] && [ -L "/etc/rc.d/rc6.d/K01unraid-api" ]; then
  printf '%s✓%s Init script symlinks for shutdown exist\n' "$GREEN" "$NC"
else
  printf '%s✗%s Init script symlinks for shutdown are missing\n' "$RED" "$NC"
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