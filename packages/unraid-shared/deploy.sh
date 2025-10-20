#!/bin/bash

# Arguments
# $1: SSH server name (required)

# Check if the server name is provided
if [[ -z "$1" ]]; then
  echo "Error: SSH server name is required."
  echo "Usage: $0 <server_name>"
  exit 1
fi

# Set server name from command-line argument
server_name="$1"

# Build the package
echo "Building unraid-shared package..."
pnpm build
if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

# Source directory path
source_directory="./dist"

# Check if dist directory exists
if [ ! -d "$source_directory" ]; then
  echo "The dist directory does not exist after build!"
  exit 1
fi

# Destination directory path - deploy to node_modules/@unraid/shared/dist
destination_directory="/usr/local/unraid-api/node_modules/@unraid/shared"

# Create destination directory on remote server
ssh root@"${server_name}" "mkdir -p $destination_directory"

# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz --delete --progress --stats -e ssh \"$source_directory/\" \"root@${server_name}:$destination_directory/\""

echo "Executing the following command:"
echo "$rsync_command"

# Execute the rsync command and capture the exit code
eval "$rsync_command"
exit_code=$?

# Chown the directory
ssh root@"${server_name}" "chown -R root:root /usr/local/unraid-api/node_modules/@unraid/"

# Run unraid-api restart on remote host
ssh root@"${server_name}" 'INTROSPECTION=true LOG_LEVEL=trace unraid-api restart'

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
