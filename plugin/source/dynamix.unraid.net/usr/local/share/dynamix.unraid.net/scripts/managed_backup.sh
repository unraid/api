#!/bin/sh

managed_backup_plugin_dir="${CONNECT_PLUGIN_CONFIG_DIR:-/boot/config/plugins/dynamix.my.servers}"
managed_backup_migration_pending="${CONNECT_MANAGED_BACKUP_MIGRATION_MARKER:-$managed_backup_plugin_dir/managed-backup-migration-pending}"
managed_backup_migration_notified="${CONNECT_MANAGED_BACKUP_NOTIFICATION_MARKER:-$managed_backup_plugin_dir/managed-backup-migration-notified}"
managed_backup_migration_complete="${CONNECT_MANAGED_BACKUP_MIGRATION_COMPLETE_MARKER:-$managed_backup_plugin_dir/managed-backup-migration-complete}"
managed_backup_boot_dir="${CONNECT_BOOT_DIR:-/boot}"
managed_backup_legacy_state="${CONNECT_LEGACY_FLASH_BACKUP_STATE:-/var/local/emhttp/flashbackup.ini}"
managed_backup_notify_command="${CONNECT_NOTIFY_COMMAND:-/usr/local/emhttp/webGui/scripts/notify}"

legacy_flash_backup_is_active() {
  _managed_legacy_remote="$(git -C "$managed_backup_boot_dir" config --get remote.origin.url 2>/dev/null || true)"
  case "$_managed_legacy_remote" in
    *backup.unraid.net*) return 0 ;;
  esac
  grep -Eq '^activated=(yes|true)$' "$managed_backup_legacy_state" 2>/dev/null
}

notify_legacy_flash_backup_migration() {
  if legacy_flash_backup_is_active; then
    if [ -e "$managed_backup_migration_complete" ]; then
      rm -f "$managed_backup_migration_pending"
      return
    fi
    mkdir -p "$(dirname "$managed_backup_migration_pending")"
    install -m 600 /dev/null "$managed_backup_migration_pending"

    if [ ! -e "$managed_backup_migration_notified" ] && [ -x "$managed_backup_notify_command" ]; then
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
