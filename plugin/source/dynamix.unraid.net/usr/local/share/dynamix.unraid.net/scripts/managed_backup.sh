#!/bin/sh

managed_backup_config_dir="${CONNECT_MANAGED_BACKUP_CONFIG_DIR:-/boot/config/unraid/backup}"
managed_backup_state="${CONNECT_MANAGED_BACKUP_STATE:-$managed_backup_config_dir/managed-flash.json}"
managed_backup_targets="${CONNECT_MANAGED_BACKUP_TARGETS:-$managed_backup_config_dir/targets.json}"
managed_backup_plugin_dir="${CONNECT_PLUGIN_CONFIG_DIR:-/boot/config/plugins/dynamix.my.servers}"
managed_backup_migration_pending="${CONNECT_MANAGED_BACKUP_MIGRATION_MARKER:-$managed_backup_plugin_dir/managed-backup-migration-pending}"
managed_backup_migration_notified="${CONNECT_MANAGED_BACKUP_NOTIFICATION_MARKER:-$managed_backup_plugin_dir/managed-backup-migration-notified}"
managed_backup_boot_dir="${CONNECT_BOOT_DIR:-/boot}"
managed_backup_legacy_state="${CONNECT_LEGACY_FLASH_BACKUP_STATE:-/var/local/emhttp/flashbackup.ini}"
managed_backup_notify_command="${CONNECT_NOTIFY_COMMAND:-/usr/local/emhttp/webGui/scripts/notify}"

managed_backup_is_ready() {
  [ -f "$managed_backup_state" ] || return 1
  [ -f "$managed_backup_targets" ] || return 1
  command -v jq >/dev/null 2>&1 || return 1

  _managed_target_id="$(jq -r '.target_id // empty' "$managed_backup_state" 2>/dev/null)"
  _managed_target_name="$(jq -r '.target_name // empty' "$managed_backup_state" 2>/dev/null)"
  _managed_repository_id="$(jq -r '.repository_id // empty' "$managed_backup_state" 2>/dev/null)"
  _managed_repository_url="$(jq -r '.repository_url // empty' "$managed_backup_state" 2>/dev/null)"
  _managed_recovery_key_id="$(jq -r '.recovery_key_id // empty' "$managed_backup_state" 2>/dev/null)"

  [ "$(jq -r '.setup_complete // false' "$managed_backup_state" 2>/dev/null)" = "true" ] || return 1
  [ -n "$_managed_target_id" ] || return 1
  [ -n "$_managed_target_name" ] || return 1
  [ -n "$_managed_repository_id" ] || return 1
  [ -n "$_managed_repository_url" ] || return 1
  [ -n "$_managed_recovery_key_id" ] || return 1
  [ -s "$managed_backup_config_dir/.credentials/$_managed_target_id.pass" ] || return 1
  [ -s "$managed_backup_config_dir/.credentials/$_managed_target_id.enc" ] || return 1
  [ -s "$managed_backup_config_dir/.credentials/$_managed_target_id.transport.enc" ] || return 1

  jq -e \
    --arg id "$_managed_target_id" \
    --arg name "$_managed_target_name" \
    --arg uri "rest:$_managed_repository_url" \
    'any(.[]; .id == $id and .name == $name and .type == "rest" and .uri == $uri and .auto_init == true and .auto_unlock == true)' \
    "$managed_backup_targets" >/dev/null 2>&1
}

legacy_flash_backup_is_active() {
  _managed_legacy_remote="$(git -C "$managed_backup_boot_dir" config --get remote.origin.url 2>/dev/null || true)"
  case "$_managed_legacy_remote" in
    *backup.unraid.net*) return 0 ;;
  esac
  grep -Eq '^activated=(yes|true)$' "$managed_backup_legacy_state" 2>/dev/null
}

notify_legacy_flash_backup_migration() {
  if legacy_flash_backup_is_active; then
    mkdir -p "$(dirname "$managed_backup_migration_pending")"
    install -m 600 /dev/null "$managed_backup_migration_pending"

    if ! managed_backup_is_ready && [ ! -e "$managed_backup_migration_notified" ] && [ -x "$managed_backup_notify_command" ]; then
      if "$managed_backup_notify_command" \
        -e "Unraid Connect" \
        -s "Set up encrypted Flash Backup" \
        -d "Your existing Flash Backup will continue to run. Open the Connect page to set up its encrypted replacement." \
        -i normal \
        -l "/Settings/ManagementAccess/Connect" \
        -x; then
        install -m 600 /dev/null "$managed_backup_migration_notified"
      fi
    fi
  else
    rm -f "$managed_backup_migration_pending"
  fi
}
