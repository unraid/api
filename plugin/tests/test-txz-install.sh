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
    "$root/usr/local/share/dynamix.unraid.net/config" \
    "$component_dir/standalone"

  touch \
    "$root/usr/local/unraid-api/dist/cli.js" \
    "$root/usr/local/unraid-api/dist/main.js"
  printf '%s\n' dynamix.unraid.net-4.37.5-x86_64-2 > "$root/usr/local/share/dynamix.unraid.net/config/package-name"
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
        "$root/var/lib/pkgtools/packages/dynamix.unraid.net-4.37.5-x86_64-2" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      write_manifest \
        "$root/var/log/packages/dynamix.unraid.net-4.37.5-x86_64-2" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/old.js"
      ;;
    legacy)
      write_manifest \
        "$root/var/log/packages/dynamix.unraid.net-4.37.5-x86_64-2" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      ;;
    upgrade-primary|upgrade-legacy|upgraded-only|upgraded-fallback|ambiguous|old-active-only|wrong-build|missing-identity|invalid-identity)
      local manifest_dir="$root/var/lib/pkgtools/packages"
      [ "$manifest_location" != "upgrade-legacy" ] || manifest_dir="$root/var/log/packages"
      write_manifest \
        "$manifest_dir/dynamix.unraid.net-4.37.4-x86_64-5-upgraded-2026-10-01,05:30:14" \
        "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/old.js"
      if [ "$manifest_location" != "upgraded-only" ] && [ "$manifest_location" != "upgraded-fallback" ] && [ "$manifest_location" != "old-active-only" ] && [ "$manifest_location" != "wrong-build" ]; then
        write_manifest \
          "$manifest_dir/dynamix.unraid.net-4.37.5-x86_64-2" \
          "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      fi
      if [ "$manifest_location" = "upgraded-fallback" ]; then
        write_manifest \
          "$root/var/log/packages/dynamix.unraid.net-4.37.5-x86_64-2" \
          "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/current.js"
      fi
      if [ "$manifest_location" = "ambiguous" ] || [ "$manifest_location" = "old-active-only" ]; then
        write_manifest \
          "$manifest_dir/dynamix.unraid.net-4.37.4-x86_64-5" \
          "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/old.js"
      fi
      if [ "$manifest_location" = "wrong-build" ]; then
        write_manifest "$manifest_dir/dynamix.unraid.net-4.37.5-x86_64-1" \
          "usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/standalone/old.js"
      fi
      if [ "$manifest_location" = "invalid-identity" ]; then
        printf '%s\n' '../dynamix.unraid.net-4.37.5-x86_64-2' > "$root/usr/local/share/dynamix.unraid.net/config/package-name"
      fi
      if [ "$manifest_location" = "missing-identity" ]; then
        rm "$root/usr/local/share/dynamix.unraid.net/config/package-name"
      fi
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
    sh "$DOINST_SCRIPT"
  )

  if [ ! -f "$component_dir/standalone/current.js" ]; then
    echo "$case_name removed a current component" >&2
    exit 1
  fi

  if [ "$manifest_location" = "none" ] || [ "$manifest_location" = "upgraded-only" ] || [ "$manifest_location" = "old-active-only" ] || [ "$manifest_location" = "wrong-build" ] || [ "$manifest_location" = "missing-identity" ] || [ "$manifest_location" = "invalid-identity" ]; then
    if [ ! -f "$component_dir/standalone/old.js" ] || [ ! -f "$component_dir/.stale" ]; then
      echo "$case_name deleted files without an unambiguous current package manifest" >&2
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
run_case "Primary upgrade preserves current components" upgrade-primary
run_case "Legacy upgrade preserves current components" upgrade-legacy
run_case "Only upgraded manifest keeps components" upgraded-only
run_case "Upgraded primary permits legacy fallback" upgraded-fallback
run_case "Exact identity selects current among active manifests" ambiguous
run_case "Lone outdated active manifest keeps components" old-active-only
run_case "Same version wrong build keeps components" wrong-build
run_case "Missing identity keeps components" missing-identity
run_case "Invalid identity keeps components" invalid-identity
run_case "Missing manifest fail-open" none
echo "TXZ install cleanup tests passed"
