#!/bin/sh

backup_file_if_exists() {
  if [ -f "$1" ]; then
    mv "$1" "$1.old"
  fi
}

for f in etc/rc.d/rc6.d/K*unraid-api etc/rc.d/rc6.d/K*flash-backup; do
  [ -e "$f" ] && chmod 755 "$f"
done

chmod +x usr/local/unraid-api/dist/cli.js
chmod +x usr/local/unraid-api/dist/main.js

rm -rf usr/local/bin/unraid-api
ln -sf ../unraid-api/dist/cli.js usr/local/bin/unraid-api
# deprecated
ln -sf ../bin/unraid-api usr/local/sbin/unraid-api
ln -sf ../local/bin/unraid-api usr/bin/unraid-api

# By default, we want to overwrite the active api-specific .env configuration on every install.
# We keep a backup in case a user needs to revert to their prior configuration.
backup_file_if_exists usr/local/unraid-api/.env
cp usr/local/unraid-api/.env.production usr/local/unraid-api/.env

remove_stale_component_files() {
  component_dir="usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"
  [ -d "$component_dir" ] || return 0

  package_identity="usr/local/share/dynamix.unraid.net/config/package-name"
  package_name=""
  if [ -r "$package_identity" ]; then
    IFS= read -r package_name < "$package_identity"
  fi
  case "$package_name" in
    ""|*[!a-zA-Z0-9._+-]*|*-upgraded-*)
      echo "Warning: Missing or invalid package identity; keeping component files"
      return 0
      ;;
    dynamix.unraid.net-*) ;;
    *) return 0 ;;
  esac

  package_db=""
  for package_dir in var/lib/pkgtools/packages var/log/packages; do
    candidate="$package_dir/$package_name"
    if [ -f "$candidate" ]; then
      package_db="$candidate"
      break
    fi
  done

  if [ -z "$package_db" ]; then
    echo "Warning: Cannot find the installed package file list; keeping component files"
    return 0
  fi

  find "$component_dir" -type f -print | while IFS= read -r file; do
    if ! grep -Fqx "$file" "$package_db"; then
      echo "Removing stale component file: $file"
      rm -f "$file"
    fi
  done

  find "$component_dir" -depth -type d -empty -delete 2>/dev/null || true
}

remove_stale_component_files
