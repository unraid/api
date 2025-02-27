#!/bin/bash

# Get host IP based on platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HOST_LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
    # Linux and others
    HOST_LAN_IP=$(hostname -I | awk '{print $1}')
fi

CI=${CI:-false}
TAG="LOCAL_PLUGIN_BUILD"
docker compose run --service-ports --rm -e HOST_LAN_IP="$HOST_LAN_IP" -e CI="$CI" -e TAG="$TAG" plugin-builder "$@" 