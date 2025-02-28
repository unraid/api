#!/bin/bash

# Get host IP based on platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HOST_LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "127.0.0.1")
else
    # Linux and others
    HOST_LAN_IP=$(hostname -I | awk '{print $1}' || echo "127.0.0.1")
fi

# Verify we have a valid IP
if [[ ! $HOST_LAN_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Could not determine valid host IP address. Using localhost."
    HOST_LAN_IP="127.0.0.1"
fi

CI=${CI:-false}
TAG="LOCAL_PLUGIN_BUILD"
docker compose run --service-ports --rm -e HOST_LAN_IP="$HOST_LAN_IP" -e CI="$CI" -e TAG="$TAG" plugin-builder "$@" 