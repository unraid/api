#!/bin/sh

# This runs both during package removal and installation
# $1 will be "remove" during package removal
# $1 will be "install" during package installation

if [ "$1" = "remove" ]; then
  # Clean up node_modules before package removal
  rm -rf /usr/local/unraid-api/node_modules
fi