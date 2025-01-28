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
source_directory="./dist"

if [ ! -d "$source_directory" ]; then
  echo "The dist directory does not exist. Attempting build..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
  fi
fi

# Change ownership on copy
# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz -e ssh $source_directory root@${server_name}:/usr/local/unraid-api"

echo "Executing the following command:"
echo "$rsync_command"

# Execute the rsync command and capture the exit code
eval "$rsync_command"
exit_code=$?

# Chown the directory
ssh root@"${server_name}" "chown -R root:root /usr/local/unraid-api"

# Run unraid-api restart on remote host
ssh root@"${server_name}" "INTROSPECTION=true LOG_LEVEL=trace unraid-api restart"

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

