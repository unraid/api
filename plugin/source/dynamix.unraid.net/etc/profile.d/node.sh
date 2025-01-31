#! /bin/bash

# Add Node.js binary path to PATH if not already present
if [[ ":$PATH:" != *":/usr/local/node/bin:"* ]]; then
    export PATH="/usr/local/node/bin:$PATH"
fi
