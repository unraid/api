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
IS_TAGGED=$(git describe --tags --abbrev=0 --exact-match || echo '')
PACKAGE_LOCK_VERSION=$(jq -r '.version' package.json)
GIT_SHA=$(git rev-parse --short HEAD)
API_VERSION=$([[ -n "$IS_TAGGED" ]] && echo "$PACKAGE_LOCK_VERSION" || echo "${PACKAGE_LOCK_VERSION}+${GIT_SHA}")

# Define container name for easier management
CONTAINER_NAME="plugin-builder"

# Create the directory if it doesn't exist
# This is to prevent errors when mounting volumes in docker compose
NUXT_COMPONENTS_DIR="../web/.nuxt/nuxt-custom-elements/dist/unraid-components"
if [ ! -d "$NUXT_COMPONENTS_DIR" ]; then
  echo "Creating directory $NUXT_COMPONENTS_DIR for Docker volume mount..."
  mkdir -p "$NUXT_COMPONENTS_DIR"
fi

# Stop any running plugin-builder container first
echo "Stopping any running plugin-builder containers..."
docker ps -q --filter "name=${CONTAINER_NAME}" | xargs -r docker stop

# Start the container with the specified environment variables
echo "Starting plugin-builder container..."

docker compose run --remove-orphans --service-ports -e HOST_LAN_IP="$HOST_LAN_IP" -e CI="$CI" -e TAG="$TAG" -e API_VERSION="$API_VERSION" ${CONTAINER_NAME} "$@"
