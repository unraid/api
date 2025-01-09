#!/bin/bash

# Bash script to sync local activation code directory to the correct location on the Unraid server's boot device

# Usage: ./sync_files.sh --local-directory <local_directory> [--remote-user <remote_user>] [--remote-host <remote_host>] [--remote-path <remote_path>]

# Example usage 0
# ./plugin/scripts/rsync-activation-dir.sh --local-directory /Users/zack/Downloads/activation_code_pdfs_12_19_2024_1436

# Path to store the last used remote host
state_file="$HOME/.deploy_state"

# Read the last used remote host from the state file
if [[ -f "$state_file" ]]; then
    LAST_REMOTE_HOST=$(cat "$state_file")
else
    LAST_REMOTE_HOST=""
fi

# Default values
REMOTE_USER="root"
REMOTE_PATH="/boot/config/activation"

# Parse named flag parameters
while [[ $# -gt 0 ]]; do
    case $1 in
        --local-directory)
            LOCAL_DIRECTORY="$2"
            shift 2
            ;;
        --remote-user)
            REMOTE_USER="$2"
            shift 2
            ;;
        --remote-host)
            REMOTE_HOST="$2"
            shift 2
            ;;
        --remote-path)
            REMOTE_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --local-directory <local_directory> [--remote-user <remote_user>] [--remote-host <remote_host>] [--remote-path <remote_path>]"
            exit 1
            ;;
    esac
done

# Validate required parameter
if [[ -z "$LOCAL_DIRECTORY" ]]; then
    echo "Error: --local-directory is required."
    exit 1
fi

# Use last remote host if none is provided
REMOTE_HOST=${REMOTE_HOST:-$LAST_REMOTE_HOST}

# Check if remote host is provided
if [[ -z "$REMOTE_HOST" ]]; then
    echo "Please provide the remote host using --remote-host."
    exit 1
fi

# Save the current remote host to the state file
echo "$REMOTE_HOST" > "$state_file"

# Check if local directory ends with a slash
if [[ "$LOCAL_DIRECTORY" != */ ]]; then
    echo "The local directory does not end with a slash."
    read -p "Do you want to append a slash to upload its contents? (y/n): " RESPONSE
    if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
        LOCAL_DIRECTORY+="/"
    fi
fi

# Execute the rsync command and capture its output
RSYNC_OUTPUT=$(rsync -av -e ssh "$LOCAL_DIRECTORY" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" 2>&1)
RSYNC_EXIT_CODE=$?

# Output the rsync command's output
echo "$RSYNC_OUTPUT"

# Check if the command was successful
if [ $RSYNC_EXIT_CODE -eq 0 ]; then
    echo "Files synchronized successfully!"
else
    echo "An error occurred during synchronization."
    exit 1
fi
