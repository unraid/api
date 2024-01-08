#!/bin/bash

# Prevent incorrect vars from being used when building for the webgui

# Set the file paths
env_production=".env.production"
env_backup=".env.backup"
env=".env"

# Backup existing .env file
if [ -f "$env" ]; then
    cp "$env" "$env_backup"
    echo "Backup of $env created at $env_backup"
else
    echo "$env not found. Creating a new one."
fi

# Copy contents from .env.production to .env
cp "$env_production" "$env"
echo "Contents of $env_production copied to $env"
