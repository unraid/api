#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOINST_SCRIPT="$SCRIPT_DIR/../source/dynamix.unraid.net/install/doinst.sh"
TEMP_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

COMPONENT_DIR="$TEMP_ROOT/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"
mkdir -p \
  "$TEMP_ROOT/etc/rc.d/rc6.d" \
  "$TEMP_ROOT/var/lib/pkgtools/packages" \
  "$TEMP_ROOT/usr/local/bin" \
  "$TEMP_ROOT/usr/local/sbin" \
  "$TEMP_ROOT/usr/bin" \
  "$TEMP_ROOT/usr/local/unraid-api/dist" \
  "$COMPONENT_DIR/standalone"

touch \
  "$TEMP_ROOT/usr/local/unraid-api/dist/cli.js" \
  "$TEMP_ROOT/usr/local/unraid-api/dist/main.js"
printf '%s\n' production > "$TEMP_ROOT/usr/local/unraid-api/.env.production"
printf '%s\n' current > "$COMPONENT_DIR/standalone/current.js"
printf '%s\n' stale > "$COMPONENT_DIR/standalone/old.js"
printf '%s\n' stale > "$COMPONENT_DIR/.stale"
cat > "$TEMP_ROOT/var/lib/pkgtools/packages/dynamix.unraid.net-test" <<EOF
PACKAGE NAME: dynamix.unraid.net-test
FILE LIST:
./
usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/
usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/
usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js
EOF

(
  cd "$TEMP_ROOT"
  sh "$DOINST_SCRIPT"
)

if [ ! -f "$COMPONENT_DIR/standalone/current.js" ]; then
  echo "Package file cleanup removed a current component" >&2
  exit 1
fi

if [ -e "$COMPONENT_DIR/standalone/old.js" ] || [ -e "$COMPONENT_DIR/.stale" ]; then
  echo "Package file cleanup left stale components" >&2
  exit 1
fi

echo "TXZ install cleanup test passed"
