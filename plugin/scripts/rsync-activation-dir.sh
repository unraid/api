#!/bin/bash

# Bash script to sync local activation code directory to the correct location on the Unraid server's boot device

# Usage: ./sync_files.sh --local-directory <local_directory> --remote-host <remote_host> [--remote-path <remote_path>] [--remove-password]

# Example usage:
# ./plugin/scripts/rsync-activation-dir.sh --local-directory /Users/zack/Downloads/activation_code_pdfs_12_19_2024_1436 --remote-host unraid.local --remove-password

# Default values
REMOTE_PATH="/boot/config/activate"
REMOVE_PASSWORD=false

# Parse named flag parameters
while [[ $# -gt 0 ]]; do
    case $1 in
        --local-directory)
            LOCAL_DIRECTORY="$2"
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
        --remove-password)
            REMOVE_PASSWORD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --local-directory <local_directory> --remote-host <remote_host> [--remote-path <remote_path>] [--remove-password]"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$LOCAL_DIRECTORY" ]]; then
    echo "Error: --local-directory is required."
    exit 1
fi

if [[ -z "$REMOTE_HOST" ]]; then
    echo "Error: --remote-host is required."
    exit 1
fi

# Check if local directory ends with a slash
if [[ "$LOCAL_DIRECTORY" != */ ]]; then
    echo "The local directory does not end with a slash."
    read -p "Do you want to append a slash to upload its contents? (y/n): " RESPONSE
    if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
        LOCAL_DIRECTORY+="/"
    fi
fi

# First, remove any existing password files on the remote server
ssh "root@$REMOTE_HOST" "rm -rf $REMOTE_PATH/*" || {
    echo "Error: Failed to clean remote directory"
    exit 1
}

# Remove Unraid password file if requested
if [[ "$REMOVE_PASSWORD" == true ]]; then
    read -p "Do you want to remove any existing Unraid license keys on the server? (y/n): " REMOVE_KEYS
    if [[ "$REMOVE_KEYS" =~ ^[Yy]$ ]]; then
        ssh "root@$REMOTE_HOST" "rm -f /boot/config/*.key" || {
            echo "Error: Failed to remove Unraid license keys"
            exit 1
        }
        echo "Removed Unraid license keys"
    fi
    ssh "root@$REMOTE_HOST" "rm -f /boot/config/passwd /boot/config/shadow /boot/config/super.dat" || {
        echo "Error: Failed to remove Unraid password file"
        exit 1
    }
    echo "Removed Unraid password file"
fi

# Execute the rsync command and capture its output
RSYNC_OUTPUT=$(rsync -av --no-owner --no-group --no-perms -e ssh "$LOCAL_DIRECTORY" "root@$REMOTE_HOST:$REMOTE_PATH" 2>&1)
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
