#!/bin/sh

rm -rf usr/local/bin/unraid-api
ln -sf usr/local/unraid-api/dist/cli.js usr/local/bin/unraid-api

# auto-generated actions from makepkg:
