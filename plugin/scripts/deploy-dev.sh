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
source_directory="plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers"

# Destination directory path
destination_directory="/usr/local/emhttp/plugins/dynamix.my.servers"

# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz --progress --stats -m -e ssh \"$source_directory/\" \"root@${server_name}:$destination_directory/\""

echo "Executing the following command:"
echo "$rsync_command"

# Execute the rsync command and capture the exit code
eval "$rsync_command"
exit_code=$?

# Play built-in sound based on the operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  afplay /System/Library/Sounds/Submarine.aiff
elif [[ "$OSTYPE" == "linux-gnu" ]]; then
  # Linux
  paplay /usr/share/sounds/freedesktop/stereo/complete.oga
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  powershell.exe -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Default.wav').PlaySync()"
fi

# Exit with the rsync command's exit code
exit $exit_code