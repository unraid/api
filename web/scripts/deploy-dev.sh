#!/bin/bash

# Check if the server name is provided
if [[ -z "$1" ]]; then
  echo "Error: SSH server name is required."
  echo "Usage: $0 <server_name>"
  exit 1
fi

# Set server name from command-line argument
server_name="$1"

# Common SSH options for reliability
SSH_OPTS='-o ConnectTimeout=5 -o ConnectionAttempts=3 -o ServerAliveInterval=5 -o ServerAliveCountMax=2'

# Simple retry helper: retry <attempts> <delay_seconds> <command...>
retry() {
  local attempts="$1"; shift
  local delay_seconds="$1"; shift
  local try=1
  while true; do
    "$@"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
      return 0
    fi
    if [ $try -ge $attempts ]; then
      return $exit_code
    fi
    sleep "$delay_seconds"
    try=$((try + 1))
  done
}

# Clean and Build
echo "Building project..."
pnpm codegen || exit 1
pnpm run clean || exit 1
pnpm run build || exit 1

# Source directory paths
standalone_directory="dist/"

# Check what we have to deploy
has_standalone=false

if [ -d "$standalone_directory" ]; then
  has_standalone=true
fi

# Exit if standalone directory doesn't exist
if [ "$has_standalone" = false ]; then
  echo "Error: Standalone apps directory does not exist."
  echo "Please run 'pnpm build' or 'pnpm build:standalone' first."
  exit 1
fi

exit_code=0

# Deploy standalone apps if they exist
if [ "$has_standalone" = true ]; then
  echo "Deploying standalone apps..."
  # Ensure remote directory exists
  retry 3 2 ssh $SSH_OPTS root@"${server_name}" "mkdir -p /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/"
  # Clear the remote standalone directory before rsyncing
  retry 3 2 ssh $SSH_OPTS root@"${server_name}" "rm -rf /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/*"
  # Run rsync with proper quoting
  retry 3 2 rsync -avz --delete --timeout=20 -e "ssh $SSH_OPTS" "$standalone_directory" "root@${server_name}:/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/"
  standalone_exit_code=$?
  # If standalone rsync failed, update exit_code
  if [ "$standalone_exit_code" -ne 0 ]; then
    exit_code=$standalone_exit_code
  fi
fi

# Update the auth-request.php file to include the new web component JS
update_auth_request() {
  local server_name="$1"
  # SSH into server and update auth-request.php
  retry 3 2 ssh $SSH_OPTS "root@${server_name}" /bin/bash -s << 'EOF'
    set -euo pipefail
    set -o errtrace
    AUTH_REQUEST_FILE='/usr/local/emhttp/auth-request.php'
    UNRAID_COMPS_DIR='/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/'

    # Find ALL JS/MJS/CSS files under unraid-components
    if [ -d "$UNRAID_COMPS_DIR" ]; then
      mapfile -t FILES_TO_ADD < <(find "$UNRAID_COMPS_DIR" -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.css" \) | sed 's|/usr/local/emhttp||' | sort -u)
    else
      echo "Unraid components directory not found"
      exit 1
    fi

    if grep -q '\$arrWhitelist' "$AUTH_REQUEST_FILE"; then
      # Create a timestamped backup
      TIMESTAMP=$(date +%s)
      BACKUP_FILE="${AUTH_REQUEST_FILE}.bak.${TIMESTAMP}"
      TEMP_FILE="${AUTH_REQUEST_FILE}.tmp.new"
      
      # Create backup
      cp "$AUTH_REQUEST_FILE" "$BACKUP_FILE" || {
        echo "Failed to create backup of $AUTH_REQUEST_FILE" >&2
        exit 1
      }
      
      # Clean up any existing temp file
      rm -f "$TEMP_FILE"
      
      # Process the file through both stages
      # First remove existing web component entries, then add new ones
      # Use a simpler approach without relying on PIPESTATUS
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
      ' "$AUTH_REQUEST_FILE" > "$TEMP_FILE.stage1" || {
        echo "Failed to process $AUTH_REQUEST_FILE (stage 1)" >&2
        rm -f "$TEMP_FILE.stage1"
        exit 1
      }

      awk -v files_to_add="$(printf '%s\n' "${FILES_TO_ADD[@]}" | sed "s/'/\\\\'/g" | sort -u | awk '{printf "  \047%s\047,\n", $0}')" '
        /\$arrWhitelist[[:space:]]*=[[:space:]]*\[/ {
          print $0
          print files_to_add
          next
        }
        { print }
      ' "$TEMP_FILE.stage1" > "$TEMP_FILE" || {
        echo "Failed to process $AUTH_REQUEST_FILE (stage 2)" >&2
        rm -f "$TEMP_FILE.stage1" "$TEMP_FILE"
        exit 1
      }

      # Clean up intermediate file
      rm -f "$TEMP_FILE.stage1"

      # Verify whitelist entries were actually injected
      if [ ${#FILES_TO_ADD[@]} -gt 0 ]; then
        if ! grep -qF "${FILES_TO_ADD[0]}" "$TEMP_FILE"; then
          echo "Failed to inject whitelist entries" >&2
          rm -f "$TEMP_FILE"
          exit 1
        fi
      fi

      # Check temp file is non-empty
      if [ ! -s "$TEMP_FILE" ]; then
        echo "Failed to process $AUTH_REQUEST_FILE - empty result" >&2
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
      
      echo "Updated $AUTH_REQUEST_FILE with new web component JS files (backup: $BACKUP_FILE)"
    else
      echo "\$arrWhitelist array not found in $AUTH_REQUEST_FILE" >&2
      exit 1
    fi
EOF
}

update_auth_request "$server_name"
auth_request_exit_code=$?

# If auth request update failed, update exit_code
if [ "$auth_request_exit_code" -ne 0 ]; then
  exit_code=$auth_request_exit_code
fi

# Play built-in sound based on the operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  afplay /System/Library/Sounds/Glass.aiff
elif [[ "$OSTYPE" == "linux-gnu" ]]; then
  # Linux
  paplay /usr/share/sounds/freedesktop/stereo/complete.oga
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  powershell.exe -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Default.wav').PlaySync()"
fi

# Exit with the final exit code (non-zero if any command failed)
exit $exit_code
