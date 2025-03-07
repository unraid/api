#!/bin/bash

# Path to store the last used server name
state_file="$HOME/.deploy_state"

# Read the last used server name from the state file
if [[ -f "$state_file" ]]; then
  last_server_name=$(cat "$state_file")
else
  last_server_name=""
fi

# Read the server name from the command-line argument or use the last used server name as the default
server_name="${1:-$last_server_name}"

# Check if the server name is provided
if [[ -z "$server_name" ]]; then
  echo "Please provide the SSH server name."
  exit 1
fi

# Save the current server name to the state file
echo "$server_name" > "$state_file"

# Source directory path
source_directory=".nuxt/nuxt-custom-elements/dist/unraid-components/"

if [ ! -d "$source_directory" ]; then
  echo "The web components directory does not exist."
  exit 1
fi

# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz -e ssh $source_directory root@${server_name}:/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/nuxt"

echo "Executing the following command:"
echo "$rsync_command"

# Execute the rsync command and capture the exit code
eval "$rsync_command"
exit_code=$?

# Update the auth-request.php file to include the new web component JS
update_auth_request() {
  local server_name="$1"
  # SSH into server and update auth-request.php
  ssh "root@${server_name}" "
    AUTH_REQUEST_FILE='/usr/local/emhttp/auth-request.php'
    WEB_COMPS_DIR='/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/nuxt/_nuxt/'

    # Find JS files and modify paths
    mapfile -t JS_FILES < <(find \"\$WEB_COMPS_DIR\" -type f -name \"*.js\" | sed 's|/usr/local/emhttp||' | sort -u)

    FILES_TO_ADD+=(\"\${JS_FILES[@]}\")

    if grep -q '\$arrWhitelist' \"\$AUTH_REQUEST_FILE\"; then
      awk '
        BEGIN { in_array = 0 }
        /\\\$arrWhitelist\s*=\s*\[/ {
          in_array = 1
          print \$0
          next
        }
        in_array && /^\s*\]/ {
          in_array = 0
          print \$0
          next
        }
        !in_array || !/\/plugins\/dynamix\.my\.servers\/unraid-components\/nuxt\/_nuxt\/unraid-components\.client-/ {
          print \$0
        }
      ' \"\$AUTH_REQUEST_FILE\" > \"\${AUTH_REQUEST_FILE}.tmp\"

      # Now add new entries right after the opening bracket
      awk -v files_to_add=\"\$(printf '%s\n' \"\${FILES_TO_ADD[@]}\" | sort -u | awk '{printf \"  \\\x27%s\\\x27,\n\", \$0}')\" '
        /\\\$arrWhitelist\s*=\s*\[/ {
          print \$0
          print files_to_add
          next
        }
        { print }
      ' \"\${AUTH_REQUEST_FILE}.tmp\" > \"\${AUTH_REQUEST_FILE}\"

      rm \"\${AUTH_REQUEST_FILE}.tmp\"
      echo \"Updated \$AUTH_REQUEST_FILE with new web component JS files\"
    else
      echo \"\\\$arrWhitelist array not found in \$AUTH_REQUEST_FILE\"
    fi
  "
}

update_auth_request "$server_name"

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

# Exit with the rsync command's exit code
exit $exit_code