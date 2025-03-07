#!/bin/bash

mkdir -p /app/deploy/
# Start http-server with common fileserver settings
http-server /app/deploy/ \
    --port 8080 \
    --host 0.0.0.0 \
    --cors \
    --gzip \
    --brotli \
    --no-dotfiles \
    -c-1 \
    --silent &

# Execute whatever command was passed (or default CMD)
exec "$@"