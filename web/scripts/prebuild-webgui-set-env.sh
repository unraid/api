#!/bin/bash

# Prevent incorrect vars from being used when building for the webgui

# Set the default file paths
env_requested="${1:-.env.production}"
env_backup=".env.backup"
env=".env"

# Backup existing .env file
if [ -f "$env" ]; then
    cp "$env" "$env_backup"
    echo "Backup of $env created at $env_backup"
else
    echo "$env not found. Creating a new one."
fi

# Copy contents from env_requested to .env
if [ -f "$env_requested" ]; then
    cp "$env_requested" "$env"
    echo "Contents of $env_requested copied to $env"
else
    echo "Error: $env_requested not found."
    exit 1
fi
