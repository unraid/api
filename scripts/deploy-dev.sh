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

# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz -e ssh .nuxt/nuxt-custom-elements/dist/connect-components root@${server_name}.local:/usr/local/emhttp/plugins/dynamix.my.servers"

echo "Executing the following command:"
echo "$rsync_command"

# Execute the rsync command
eval "$rsync_command"
