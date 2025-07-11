#!/bin/bash
# Dependency management functions
# This script provides functions to manage node.js dependencies and vendor archives

# Source shared utilities
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
# shellcheck source=./api_utils.sh
source "${SCRIPT_DIR}/api_utils.sh"

# Default paths
DEPENDENCIES_DIR="/usr/local/unraid-api/node_modules"

# Function to cleanup old dependency archives
# Removes all node_modules archives except the one for the current API version
cleanup() {
  local info
  local api_version=""
  local vendor_store_path=""
  local vendor_dir=""
  local current_archive=""
  
  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed with cleanup." >&2
    return 1
  fi
  
  api_version="${info[0]}"
  vendor_store_path="${info[1]}"
  
  echo "Cleaning up node_modules archives that don't match current API version: $api_version"
  
  # Extract the directory path from the full vendor_store_path
  vendor_dir="$(dirname "$vendor_store_path")"
  
  # Extract the filename from the full vendor_store_path - this is our current archive
  current_archive="$(basename "$vendor_store_path")"
  
  # Check if vendor directory exists
  if [ ! -d "$vendor_dir" ]; then
    echo "Vendor directory $vendor_dir does not exist. Nothing to clean up."
    return 0
  fi
  
  echo "Current archive to keep: $current_archive"
  
  # Find and remove all node_modules archives except the current one
  find "$vendor_dir" -name "node_modules-for-*.tar.xz" | while read -r archive; do
    if [ "$(basename "$archive")" != "$current_archive" ]; then
      echo "Removing archive: $archive"
      rm -f "$archive"
    else
      echo "Keeping current archive: $archive"
    fi
  done
  
  echo "Cleanup completed."
  return 0
}

# Function to attempt redownload of vendor archive if missing
# Args:
#   $1 - Path to vendor archive to download (ignored, kept for backward compatibility)
redownload_vendor_archive() {
  echo "Error: Download functionality not available - vendor store URL not configured" >&2
  return 1
}

# Function to ensure vendor archive is available
# Returns the path to the vendor archive or empty string if not available
ensure_vendor_archive() {
  # Define all local variables at the top
  local info
  local api_version=""
  local vendor_store_path=""
  
  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed." >&2
    return 1
  fi
  
  api_version="${info[0]}"
  vendor_store_path="${info[1]}"
  
  echo "Looking for vendor archive at $vendor_store_path" >&2
  
  # Check if the expected archive exists
  if [ -f "$vendor_store_path" ]; then
    echo "$vendor_store_path"
    return 0
  fi
  
  # No vendor archive available
  echo "No vendor archive available at $vendor_store_path" >&2
  return 1
}

# Restores the node_modules directory from a backup file
# Args:
#   $1 - Path to the backup file (tar.xz format) [optional - if not provided, uses vendor store path]
# Returns:
#   0 on success, 1 on failure
# Note: Requires 1.5x the backup size in free space for safe extraction
restore_dependencies() {
  backup_file="$1"
  
  # If no backup file provided, get it from vendor store path
  if [ -z "$backup_file" ]; then
    local info
    local vendor_store_path=""

    # Get archive information
    if ! mapfile -t info < <(get_archive_information); then
      echo "Error: Failed to get vendor archive information. Skipping restore." >&2
      return 0
    fi

    vendor_store_path="${info[1]}"

    if [ -z "$vendor_store_path" ]; then
      echo "Vendor store path is undefined. Skipping restore."
      return 0
    fi

    backup_file="$vendor_store_path"
  fi
  
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
  local vendor_store_path=""
  local source_dir="$DEPENDENCIES_DIR"
  local archive_file=""

  # Get archive information
  if ! mapfile -t info < <(get_archive_information); then
    echo "Error: Failed to get vendor archive information. Cannot proceed." >&2
    return 1
  else
    api_version="${info[0]}"
    vendor_store_path="${info[1]}"
    
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
    restore_dependencies "$2"
    exit $?
    ;;
  'archive')
    archive_dependencies
    exit $?
    ;;
  'ensure')
    ensure "$2"
    exit $?
    ;;
  'cleanup')
    cleanup
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
    echo "Usage: $0 {restore [archive_path]|archive|ensure|cleanup|redownload}"
    exit 1
    ;;
esac 