#!/bin/bash
set -euo pipefail

archive="$(realpath "${1:?Usage: test-built-txz-install.sh package.txz}")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
show_logs() {
  local log
  for log in "$work/"*.log; do
    [ ! -f "$log" ] || tail -n 20 "$log"
  done
}
trap show_logs ERR
root="$work/root"
reference="$work/reference"
components="usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"
mkdir -p "$root/usr/local/sbin" "$root/usr/bin" "$reference" "$work/old/$components/standalone"
tar -xJf "$archive" -C "$reference"
identity="$(cat "$reference/usr/local/share/dynamix.unraid.net/config/package-name")"
[ "$identity.txz" = "$(basename "$archive")" ]
printf '%s\n' stale > "$work/old/$components/standalone/old.js"
(
  cd "$work/old"
  tar -cJf "$work/dynamix.unraid.net-4.37.4-x86_64-5.txz" .
)
installpkg --root "$root" "$work/dynamix.unraid.net-4.37.4-x86_64-5.txz" > "$work/install-old.log"
ROOT="$root" upgradepkg --install-new --reinstall "$archive" > "$work/upgrade.log"

verify_install() {
  local count=0
  while IFS= read -r file; do
    cmp "$reference/$file" "$root/$file"
    count=$((count + 1))
  done < <(cd "$reference" && find "$components" -type f)
  [ "$count" -gt 0 ]
  [ ! -e "$root/$components/standalone/old.js" ]
  cmp "$reference/usr/local/unraid-api/dist/cli.js" "$root/usr/local/unraid-api/dist/cli.js"
  cmp "$reference/usr/local/unraid-api/dist/main.js" "$root/usr/local/unraid-api/dist/main.js"
  cmp "$root/usr/local/unraid-api/.env.production" "$root/usr/local/unraid-api/.env"
  [ "$(readlink "$root/usr/local/bin/unraid-api")" = "../unraid-api/dist/cli.js" ]
  [ "$(readlink "$root/usr/local/sbin/unraid-api")" = "../bin/unraid-api" ]
  [ "$(readlink "$root/usr/bin/unraid-api")" = "../local/bin/unraid-api" ]
  [ -f "$root/var/lib/pkgtools/packages/$identity" ]
  echo "Verified $count component files and API payload, environment, CLI link, and exact manifest"
}
verify_install

cat > "$root/var/lib/pkgtools/packages/dynamix.unraid.net-4.37.4-x86_64-5-upgraded-2026-10-01,05:30:14" <<MANIFEST
PACKAGE NAME: dynamix.unraid.net-4.37.4-x86_64-5
FILE LIST:
$components/standalone/old.js
MANIFEST
printf '%s\n' stale > "$root/$components/standalone/old.js"
installpkg --root "$root" "$archive" > "$work/reinstall.log"
verify_install

# API execution uses the Node binary and CLI shipped in the TXZ.
"$root/usr/local/bin/node" "$root/usr/local/unraid-api/dist/cli.js" --help > "$work/api-help.log"
grep -q 'unraid-api' "$work/api-help.log"
echo "Built TXZ upgrade, reinstall, component integrity, and packaged API CLI checks passed"
