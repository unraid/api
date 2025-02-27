#!/bin/bash

mkdir -p /app/deploy/release
# Start http-server with common fileserver settings
http-server /app/deploy/release/ \
    --port 8080 \
    --host 0.0.0.0 \
    --cors \
    --gzip \
    --brotli \
    --no-dotfiles \
    --silent &

# Execute whatever command was passed (or default CMD)
exec "$@"