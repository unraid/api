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
echo "Removing components directory..."
ssh root@"${server_name}" "rm -rf /usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/"
components_exit_code=$?
if [ $components_exit_code -ne 0 ]; then
  echo "Warning: Failed to remove components directory"
  exit_code=$components_exit_code
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
