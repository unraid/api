#!/bin/bash
# API Utilities
# Shared functions for API version detection and dependency management

# Default paths
CONFIG_FILE="/usr/local/share/dynamix.unraid.net/config/vendor_archive.json"

# Get API version from config file
# Returns the API version string or empty if not found
get_api_version() {
  local api_version=""
  
  # Get version from config file
  if [ -f "$CONFIG_FILE" ] && command -v jq >/dev/null 2>&1; then
    api_version=$(jq -r '.api_version' "$CONFIG_FILE")
    if [ -n "$api_version" ] && [ "$api_version" != "null" ]; then
      echo "$api_version"
      return 0
    fi
  fi
  
  # No version found
  return 1
}

# Get vendor archive configuration information 
# Returns an array of values: api_version, vendor_store_url, vendor_store_path
get_archive_information() {
  # Define all local variables at the top
  local api_version=""
  local vendor_store_path=""
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Vendor archive config file not found at $CONFIG_FILE" >&2
    return 1
  fi
  
  # Read values from JSON config using jq
  if command -v jq >/dev/null 2>&1; then
    api_version=$(jq -r '.api_version' "$CONFIG_FILE")
    vendor_store_path=$(jq -r '.vendor_store_path' "$CONFIG_FILE")
  else
    echo "jq not found, can't parse config file" >&2
    return 1
  fi
  
  # Validate that all required values exist and are not null
  if [ -z "$api_version" ] || [ "$api_version" = "null" ]; then
    echo "Invalid or missing api_version in config file" >&2
    return 1
  fi
  
  if [ -z "$vendor_store_path" ] || [ "$vendor_store_path" = "null" ]; then
    echo "Invalid or missing vendor_store_path in config file" >&2
    return 1
  fi
  
  # Return the values
  echo "$api_version"
  echo "$vendor_store_path"
  return 0
} 