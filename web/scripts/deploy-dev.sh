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
