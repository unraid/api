#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOINST_SCRIPT="$SCRIPT_DIR/../source/dynamix.unraid.net/install/doinst.sh"

prepare_root() {
  local root="$1"
  local component_dir="$root/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"

  mkdir -p \
    "$root/etc/rc.d/rc6.d" \
    "$root/var/lib/pkgtools/packages" \
    "$root/var/log/packages" \
    "$root/usr/local/bin" \
    "$root/usr/local/sbin" \
    "$root/usr/bin" \
    "$root/usr/local/unraid-api/dist" \
    "$component_dir/standalone"

  touch \
    "$root/usr/local/unraid-api/dist/cli.js" \
    "$root/usr/local/unraid-api/dist/main.js"
  printf '%s\n' production > "$root/usr/local/unraid-api/.env.production"
  printf '%s\n' current > "$component_dir/standalone/current.js"
  printf '%s\n' stale > "$component_dir/standalone/old.js"
  printf '%s\n' stale > "$component_dir/.stale"
}

write_manifest() {
  local manifest_path="$1"
  local current_file="$2"
  local stale_file="${3:-}"

  cat > "$manifest_path" <<EOF
PACKAGE NAME: dynamix.unraid.net-test
FILE LIST:
./
usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/
usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/
$current_file
$stale_file
EOF
}

run_case() {
  local case_name="$1"
  local manifest_location="$2"
  local root
  local component_dir

  root="$(mktemp -d)"
  trap 'rm -rf "$root"' EXIT
  component_dir="$root/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"
  prepare_root "$root"

  case "$manifest_location" in
    primary)
      write_manifest \
        "$root/var/lib/pkgtools/packages/dynamix.unraid.net-primary" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      write_manifest \
        "$root/var/log/packages/dynamix.unraid.net-legacy" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/old.js"
      ;;
    legacy)
      write_manifest \
        "$root/var/log/packages/dynamix.unraid.net-legacy" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      ;;
    none)
      ;;
    *)
      echo "Unknown manifest location: $manifest_location" >&2
      exit 1
      ;;
  esac

  (
    cd "$root"
    sh "$DOINST_SCRIPT"
  )

  if [ ! -f "$component_dir/standalone/current.js" ]; then
    echo "$case_name removed a current component" >&2
    exit 1
  fi

  if [ "$manifest_location" = "none" ]; then
    if [ ! -f "$component_dir/standalone/old.js" ] || [ ! -f "$component_dir/.stale" ]; then
      echo "$case_name deleted files without a package manifest" >&2
      exit 1
    fi
  elif [ -e "$component_dir/standalone/old.js" ] || [ -e "$component_dir/.stale" ]; then
    echo "$case_name left stale components" >&2
    exit 1
  fi

  rm -rf "$root"
  trap - EXIT
  echo "$case_name passed"
}

run_case "Primary manifest" primary
run_case "Legacy manifest fallback" legacy
run_case "Missing manifest fail-open" none
echo "TXZ install cleanup tests passed"
