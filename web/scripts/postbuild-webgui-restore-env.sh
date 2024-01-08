#!/bin/bash

# Set the file paths
env_backup=".env.backup"
env=".env"

# Check if backup exists
if [ -f "$env_backup" ]; then
    # Restore contents from backup to .env
    cp "$env_backup" "$env"
    echo "Contents restored from $env_backup to $env"
    # Remove backup
    rm "$env_backup"
    echo "Backup file $env_backup removed."
else
    echo "Backup file $env_backup not found. Unable to restore."
fi
