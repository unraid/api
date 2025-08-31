#!/bin/bash

# Check if the server name is provided
if [[ -z "$1" ]]; then
  echo "Error: SSH server name is required."
  echo "Usage: $0 <server_name>"
  exit 1
fi

# Set server name from command-line argument
server_name="$1"

# Source directory paths
webcomponents_directory=".nuxt/nuxt-custom-elements/dist/unraid-components/"
standalone_directory=".nuxt/standalone-apps/"

# Check what we have to deploy
has_webcomponents=false
has_standalone=false

if [ -d "$webcomponents_directory" ]; then
  has_webcomponents=true
fi

if [ -d "$standalone_directory" ]; then
  has_standalone=true
fi

# Exit if neither exists
if [ "$has_webcomponents" = false ] && [ "$has_standalone" = false ]; then
  echo "Error: Neither web components nor standalone apps directory exists."
  echo "Please run 'pnpm build' or 'pnpm build:standalone' first."
  exit 1
fi

exit_code=0

# Deploy web components if they exist
if [ "$has_webcomponents" = true ]; then
  echo "Deploying web components..."
  # Run rsync with proper quoting and --delete for safe mirroring
  rsync -avz --delete -e "ssh" "$webcomponents_directory" "root@${server_name}:/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/nuxt/"
  exit_code=$?
fi

# Deploy standalone apps if they exist
if [ "$has_standalone" = true ]; then
  echo "Deploying standalone apps..."
  # Ensure remote directory exists
  ssh root@"${server_name}" "mkdir -p /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/"
  # Run rsync with proper quoting
  rsync -avz --delete -e "ssh" "$standalone_directory" "root@${server_name}:/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/"
  standalone_exit_code=$?
  # If standalone rsync failed, update exit_code
  if [ $standalone_exit_code -ne 0 ]; then
    exit_code=$standalone_exit_code
  fi
fi

# Update the auth-request.php file to include the new web component JS
update_auth_request() {
  local server_name="$1"
  # SSH into server and update auth-request.php
  ssh "root@${server_name}" bash -s << 'EOF'
    AUTH_REQUEST_FILE='/usr/local/emhttp/auth-request.php'
    WEB_COMPS_DIR='/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/nuxt/_nuxt/'
    STANDALONE_DIR='/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/'

    # Find JS files and modify paths
    mapfile -t JS_FILES < <(find "$WEB_COMPS_DIR" -type f -name "*.js" | sed 's|/usr/local/emhttp||' | sort -u)
    
    # Find standalone JS files if directory exists
    if [ -d "$STANDALONE_DIR" ]; then
      mapfile -t STANDALONE_JS < <(find "$STANDALONE_DIR" -type f -name "*.js" | sed 's|/usr/local/emhttp||' | sort -u)
      FILES_TO_ADD+=("${STANDALONE_JS[@]}")
    fi

    FILES_TO_ADD+=("${JS_FILES[@]}")

    if grep -q '\$arrWhitelist' "$AUTH_REQUEST_FILE"; then
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
        !in_array || !/\/plugins\/dynamix\.my\.servers\/unraid-components\/(nuxt\/_nuxt|standalone)\/.*\.m?js/ {
          print $0
        }
      ' "$AUTH_REQUEST_FILE" > "${AUTH_REQUEST_FILE}.tmp"

      # Now add new entries right after the opening bracket
      awk -v files_to_add="$(printf '%s\n' "${FILES_TO_ADD[@]}" | sort -u | awk '{printf "  \047%s\047,\n", $0}')" '
        /\$arrWhitelist\s*=\s*\[/ {
          print $0
          print files_to_add
          next
        }
        { print }
      ' "${AUTH_REQUEST_FILE}.tmp" > "${AUTH_REQUEST_FILE}"

      rm "${AUTH_REQUEST_FILE}.tmp"
      echo "Updated $AUTH_REQUEST_FILE with new web component JS files"
    else
      echo "\$arrWhitelist array not found in $AUTH_REQUEST_FILE"
    fi
EOF
}

update_auth_request "$server_name"
auth_request_exit_code=$?

# If auth request update failed, update exit_code
if [ $auth_request_exit_code -ne 0 ]; then
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