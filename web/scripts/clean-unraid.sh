#!/bin/bash

# Check if the server name is provided
if [[ -z "$1" ]]; then
  echo "Error: SSH server name is required."
  echo "Usage: $0 <server_name>"
  exit 1
fi

# Set server name from command-line argument
server_name="$1"

echo "Cleaning deployed files from Unraid server: $server_name"

exit_code=0

# Remove standalone apps directory
echo "Removing standalone apps directory..."
ssh root@"${server_name}" "rm -rf /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/"
standalone_exit_code=$?
if [ $standalone_exit_code -ne 0 ]; then
  echo "Warning: Failed to remove standalone apps directory"
  exit_code=$standalone_exit_code
fi

# Clean up auth-request.php file
clean_auth_request() {
  local server_name="$1"
  echo "Cleaning auth-request.php file..."
  
  # SSH into server and clean auth-request.php
  ssh "root@${server_name}" bash -s << 'EOF'
    AUTH_REQUEST_FILE='/usr/local/emhttp/auth-request.php'
    
    if [ ! -f "$AUTH_REQUEST_FILE" ]; then
      echo "Auth request file not found: $AUTH_REQUEST_FILE"
      exit 0
    fi
    
    if grep -q '\$arrWhitelist' "$AUTH_REQUEST_FILE"; then
      # Create a timestamped backup
      TIMESTAMP=$(date +%s)
      BACKUP_FILE="${AUTH_REQUEST_FILE}.bak.clean.${TIMESTAMP}"
      TEMP_FILE="${AUTH_REQUEST_FILE}.tmp.clean"
      
      # Create backup
      cp "$AUTH_REQUEST_FILE" "$BACKUP_FILE" || {
        echo "Failed to create backup of $AUTH_REQUEST_FILE" >&2
        exit 1
      }
      
      # Clean up any existing temp file
      rm -f "$TEMP_FILE"
      
      # Remove all unraid-components entries from the whitelist array
      awk '
        BEGIN { in_array = 0 }
        /\$arrWhitelist\s*=\s*\[/ {
          in_array = 1
          print $0
          next
        }
        in_array && /^\s*\]/ {
          in_array = 0
          print $0
          next
        }
        !in_array || !/\/plugins\/dynamix\.my\.servers\/unraid-components\/.*\.(m?js|css)/ {
          print $0
        }
      ' "$AUTH_REQUEST_FILE" > "$TEMP_FILE"
      
      # Check if processing succeeded and temp file is non-empty
      if [ $? -ne 0 ] || [ ! -s "$TEMP_FILE" ]; then
        echo "Failed to process $AUTH_REQUEST_FILE" >&2
        rm -f "$TEMP_FILE"
        exit 1
      fi
      
      # Verify the temp file has the expected content
      if ! grep -q '\$arrWhitelist' "$TEMP_FILE" 2>/dev/null; then
        echo "Generated file does not contain \$arrWhitelist array" >&2
        rm -f "$TEMP_FILE"
        exit 1
      fi
      
      # Atomically replace the original file
      mv "$TEMP_FILE" "$AUTH_REQUEST_FILE" || {
        echo "Failed to update $AUTH_REQUEST_FILE" >&2
        rm -f "$TEMP_FILE"
        exit 1
      }
      
      echo "Cleaned $AUTH_REQUEST_FILE (backup: $BACKUP_FILE)"
    else
      echo "\$arrWhitelist array not found in $AUTH_REQUEST_FILE" >&2
      exit 1
    fi
EOF
}

clean_auth_request "$server_name"
auth_request_exit_code=$?

# If auth request cleanup failed, update exit_code
if [ $auth_request_exit_code -ne 0 ]; then
  echo "Warning: Failed to clean auth-request.php"
  exit_code=$auth_request_exit_code
fi

# Remove the parent unraid-components directory if it's empty
echo "Cleaning up empty directories..."
ssh root@"${server_name}" "rmdir /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/ 2>/dev/null || true"

if [ $exit_code -eq 0 ]; then
  echo "Successfully cleaned all deployed files from $server_name"
  
  # Play success sound based on the operating system
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    afplay /System/Library/Sounds/Purr.aiff 2>/dev/null || true
  elif [[ "$OSTYPE" == "linux-gnu" ]]; then
    # Linux
    paplay /usr/share/sounds/freedesktop/stereo/bell.oga 2>/dev/null || true
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    powershell.exe -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\chimes.wav').PlaySync()" 2>/dev/null || true
  fi
else
  echo "Some cleanup operations failed (exit code: $exit_code)"
fi

# Exit with the final exit code
exit $exit_code