#!/bin/bash
nodemon --verbose \
  --watch 'source/**/*' \
  --watch 'plugins/dynamix.unraid.net.plg' \
  --ext ts,js,plg,sh,xz,json \
  --ignore '*.test.ts' \
  --ignore 'node_modules/**' \
  --ignore 'source/dynamix.unraid.net/doinst.sh' \
  --ignore 'source/dynamix.unraid.net/usr/local/share/dynamix.unraid.net/config/vendor_archive.json' \
  --delay 30s \
  --exec 'pnpm run build' 