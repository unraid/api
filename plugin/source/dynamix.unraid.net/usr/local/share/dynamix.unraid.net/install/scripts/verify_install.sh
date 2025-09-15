#!/bin/bash
# Unraid API Installation Verification Script
# Checks that critical files are installed correctly

# Function to check for non-bash shells
check_shell() {
  # This script runs with #!/bin/bash shebang
  # On Unraid, users may configure bash to load other shells through .bashrc
  # We need to check if the interpreter running this script is actually bash
  # Use readlink on /proc to find the actual interpreter, not the script name
  local current_shell

  # Get the actual interpreter from /proc
  if [ -e "/proc/$$/exe" ]; then
    current_shell=$(readlink "/proc/$$/exe")
  else
    # Fallback to checking the current process if /proc isn't available
    # Note: This may return the script name on some systems
    current_shell=$(ps -o comm= -p $$)
  fi

  # Remove any path and get just the shell name
  current_shell=$(basename "$current_shell")
  
  if [[ "$current_shell" != "bash" ]]; then
    echo "Unsupported shell detected: $current_shell" >&2
    echo "Unraid scripts require bash but your system is configured to use $current_shell for scripts." >&2
    echo "This can cause infinite loops or unexpected behavior when Unraid scripts execute." >&2
    echo "Please configure $current_shell to only activate for interactive shells." >&2
    echo "Add this check to your ~/.bashrc or /etc/profile before starting $current_shell:" >&2
    echo "  [[ \$- == *i* ]] && exec $current_shell" >&2
    echo "This ensures $current_shell only starts for interactive sessions, not scripts." >&2
    exit 1
  fi
}

# Run shell check first
check_shell

echo "Performing comprehensive installation verification..."

# Define critical files to check (POSIX-compliant, no arrays)
CRITICAL_FILES="/usr/local/bin/unraid-api 
/etc/rc.d/rc.unraid-api
/usr/local/emhttp/plugins/dynamix.my.servers/scripts/gitflash_log"

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
    printf '✓ Executable file %s exists and is executable\n' "$1"
    return 0
  elif [ -f "$1" ]; then
    printf '⚠ File %s exists but is not executable\n' "$1"
    return 1
  else
    printf '✗ Executable file %s is missing\n' "$1"
    return 2
  fi
}

# Function to check if directory exists
check_dir() {
  if [ -d "$1" ]; then
    printf '✓ Directory %s exists\n' "$1"
    return 0
  else
    printf '✗ Directory %s is missing\n' "$1"
    return 1
  fi
}

# Function to check symlinks
check_symlink() {
  if [ -L "$1" ]; then
    printf '✓ Symlink %s exists -> %s\n' "$1" "$(readlink "$1")"
    return 0
  else
    printf '✗ Symlink %s is missing\n' "$1"
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
  printf '✓ Environment file %s exists\n' "$ENV_FILE"
else
  printf '✗ Environment file %s is missing\n' "$ENV_FILE"
  CONFIG_ERRORS=$((CONFIG_ERRORS + 1))
fi
TOTAL_ERRORS=$((TOTAL_ERRORS + CONFIG_ERRORS))

# Check for proper Slackware-style shutdown configuration
echo "Checking shutdown configuration..."
SHUTDOWN_ERRORS=0

# Check for package-provided shutdown scripts in rc6.d directory
echo "Checking for shutdown scripts in rc6.d..."
if [ -x "/etc/rc.d/rc6.d/K10flash-backup" ]; then
  printf '✓ Shutdown script for flash-backup exists and is executable\n'
else
  printf '✗ Shutdown script for flash-backup missing or not executable\n'
  SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
fi

# Check for unraid-api shutdown script
if [ -x "/etc/rc.d/rc6.d/K20unraid-api" ]; then
  printf '✓ Shutdown script for unraid-api exists and is executable\n'
else
  printf '✗ Shutdown script for unraid-api missing or not executable\n'
  SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
fi

# Check for rc0.d symlink or directory
if [ -L "/etc/rc.d/rc0.d" ]; then
  printf '✓ rc0.d symlink exists\n'
elif [ -d "/etc/rc.d/rc0.d" ]; then
  printf '✓ rc0.d directory exists\n'
else
  printf '✗ rc0.d symlink or directory missing\n'
  SHUTDOWN_ERRORS=$((SHUTDOWN_ERRORS + 1))
fi

TOTAL_ERRORS=$((TOTAL_ERRORS + SHUTDOWN_ERRORS))

# Check if unraid-api is in path
if command -v unraid-api >/dev/null 2>&1; then
  printf '✓ unraid-api is in PATH\n'
else
  printf '⚠ unraid-api is not in PATH\n'
  TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

# Log file check
if [ -f "/var/log/unraid-api/dynamix-unraid-install.log" ]; then
  printf '✓ Installation log file exists\n'
else
  printf '⚠ Installation log file not found\n'
fi

# Summary
echo ""
echo "Verification summary:"
echo "- Executable files errors: $EXEC_ERRORS"
echo "- Directory errors: $DIR_ERRORS"
echo "- Symlink errors: $SYMLINK_ERRORS"
echo "- Configuration errors: $CONFIG_ERRORS"
echo "- Shutdown configuration errors: $SHUTDOWN_ERRORS"
echo "- Total errors: $TOTAL_ERRORS"

if [ $TOTAL_ERRORS -eq 0 ]; then
  printf 'All checks passed successfully.\n'
  echo "Installation verification completed successfully."
  exit 0
else
  printf 'Found %d total errors.\n' "$TOTAL_ERRORS"
  echo "Installation verification completed with issues."
  echo "Please review the errors above and contact support if needed."
  # We don't exit with error as this is just a verification script
  exit 0
fi 