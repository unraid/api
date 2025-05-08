#!/bin/bash
# Dependency management functions
# This script provides functions to manage node.js dependencies and vendor archives

# Source shared utilities
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
# shellcheck source=./api_utils.sh
source "${SCRIPT_DIR}/api_utils.sh"

# Default paths
DEPENDENCIES_DIR="/usr/local/unraid-api/node_modules"
CONFIG_FILE="/usr/local/share/dynamix.unraid.net/config/vendor_archive.json"

# Function to attempt redownload of vendor archive if missing
# Args:
#   $1 - Path to vendor archive to download (ignored, kept for backward compatibility)
redownload_vendor_archive() {
  # Define all local variables at the top
  local info
  local api_version=""
  local vendor_store_url=""
  local vendor_store_path=""
  
  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed." >&2
    return 1
  fi
  
  api_version="${info[0]}"
  vendor_store_url="${info[1]}"
  vendor_store_path="${info[2]}"
  
  echo "Attempting to download vendor archive for version $api_version"
  
  # Create directory if it doesn't exist
  mkdir -p "$(dirname "$vendor_store_path")"
  
  # Attempt to download the vendor archive
  echo "Downloading vendor archive from $vendor_store_url to $vendor_store_path"
  if curl -f -L "$vendor_store_url" -o "$vendor_store_path"; then
    echo "Successfully downloaded vendor archive to $vendor_store_path"
    # Return the path to the downloaded archive
    echo "$vendor_store_path"
    return 0
  else
    echo "Failed to download vendor archive from URL"
    return 1
  fi
}

# Function to ensure vendor archive is available
# This tries to locate or download the appropriate vendor archive
# Returns the path to the vendor archive or empty string if not available
ensure_vendor_archive() {
  # Define all local variables at the top
  local info
  local api_version=""
  local vendor_store_url=""
  local vendor_store_path=""
  
  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed." >&2
    return 1
  fi
  
  api_version="${info[0]}"
  vendor_store_url="${info[1]}"
  vendor_store_path="${info[2]}"
  
  echo "Looking for vendor archive at $vendor_store_path" >&2
  
  # Check if the expected archive exists
  if [ -f "$vendor_store_path" ]; then
    echo "$vendor_store_path"
    return 0
  fi
  
  # Expected archive is missing, attempt to download
  echo "Expected vendor archive missing at $vendor_store_path. Attempting to download..." >&2
  downloaded_archive=$(redownload_vendor_archive)
  if [ -n "$downloaded_archive" ] && [ -f "$downloaded_archive" ]; then
    echo "$downloaded_archive"
    return 0
  fi
  
  # No vendor archive available
  echo "No vendor archive available" >&2
  return 1
}

# Restores the node_modules directory from a backup file
# Args:
#   $1 - Path to the backup file (tar.xz format)
# Returns:
#   0 on success, 1 on failure
# Note: Requires 1.5x the backup size in free space for safe extraction
restore_dependencies() {
  backup_file="$1"
  
  # Check if backup file exists
  if [ ! -f "$backup_file" ]; then
    echo "Backup file not found at '$backup_file'. Skipping restore."
    return 0
  fi

  # Check available disk space in destination
  backup_size=$(stat -c%s "$backup_file")
  dest_space=$(df --output=avail "$(dirname "$DEPENDENCIES_DIR")" | tail -n1)
  dest_space=$((dest_space * 1024)) # Convert KB to bytes

  # Require 1.5x the backup size for safe extraction
  required_space=$((backup_size + (backup_size / 2)))

  if [ "$dest_space" -lt "$required_space" ]; then
    echo "Error: Insufficient disk space in destination. Need at least $((required_space / 1024 / 1024))MB, have $((dest_space / 1024 / 1024))MB"
    return 1
  fi

  echo "Restoring node_modules from '$backup_file' to '$DEPENDENCIES_DIR'"
  # Remove existing store directory if it exists and ensure its parent directory exists
  rm -rf "$DEPENDENCIES_DIR"
  mkdir -p "$(dirname "$DEPENDENCIES_DIR")"

  # Extract directly to final location
  if ! tar -xJf "$backup_file" -C "$(dirname "$DEPENDENCIES_DIR")" --preserve-permissions; then
    echo "Error: Failed to extract backup to final location."
    rm -rf "$DEPENDENCIES_DIR"
    return 1
  fi

  # Set ownership to root (0:0)
  chown -R 0:0 "$DEPENDENCIES_DIR"

  echo "node_modules restored successfully."
  return 0
}

# Archives the node_modules directory to a specified location
# Returns:
#   0 on success, 1 on failure
archive_dependencies() {
  # Define all local variables at the top
  local info
  local api_version=""
  local vendor_store_url=""
  local vendor_store_path=""
  local source_dir="$DEPENDENCIES_DIR"
  local archive_file=""

  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed." >&2
    return 1
  else
    api_version="${info[0]}"
    vendor_store_url="${info[1]}"
    vendor_store_path="${info[2]}"
    
    archive_file="$vendor_store_path"
  fi

  # Check if source directory exists
  if [ ! -d "$source_dir" ]; then
    echo "Error: Source node_modules directory '$source_dir' does not exist."
    return 1
  fi

  # Create destination directory if it doesn't exist
  mkdir -p "$(dirname "$archive_file")"

  echo "Archiving node_modules from '$source_dir' to '$archive_file'"

  # Create archive with XZ compression level 5, preserving symlinks
  if XZ_OPT=-5 tar -cJf "$archive_file" -C "$(dirname "$source_dir")" "$(basename "$source_dir")"; then
    echo "node_modules archive created successfully."
    return 0
  else
    echo "Error: Failed to create node_modules archive."
    return 1
  fi
}

# Function to ensure dependencies are installed
ensure() {
  # Check if dependencies directory already exists and is populated
  if [ -d "$DEPENDENCIES_DIR" ] && [ "$(ls -A "$DEPENDENCIES_DIR" 2>/dev/null)" ]; then
    echo "Dependencies directory already exists and is populated."
    return 0
  fi
  
  # If explicit archive path is provided, use it
  if [ -n "$1" ] && [ -f "$1" ]; then
    echo "Using provided vendor archive: $1"
    restore_dependencies "$1"
    return $?
  fi
  
  # Get vendor archive path
  vendor_archive=$(ensure_vendor_archive)
  
  if [ -n "$vendor_archive" ] && [ -f "$vendor_archive" ]; then
    echo "Found vendor archive at $vendor_archive"
    restore_dependencies "$vendor_archive"
    return $?
  else
    echo "No vendor archive available. Cannot restore dependencies."
    return 1
  fi
}

# Main logic
case "$1" in
  'restore')
    if [ -n "$2" ]; then
      restore_dependencies "$2"
      exit $?
    else
      echo "Usage: $0 restore <archive_path>"
      exit 1
    fi
    ;;
  'archive')
    archive_dependencies
    exit $?
    ;;
  'ensure')
    ensure "$2"
    exit $?
    ;;
  'redownload')
    # The path argument is ignored but kept for backward compatibility
    if downloaded_archive=$(redownload_vendor_archive) && [ -n "$downloaded_archive" ]; then
      echo "Downloaded archive to: $downloaded_archive"
      exit 0
    else
      echo "Failed to download vendor archive"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {restore|archive|ensure|redownload}"
    exit 1
    ;;
esac 