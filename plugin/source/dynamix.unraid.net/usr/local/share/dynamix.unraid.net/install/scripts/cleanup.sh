#!/bin/sh
# Script to handle cleanup operations during removal and restoration during install/upgrade

# Get the operation mode
MODE="${1:-cleanup}"

# File restoration function - runs during both install and remove
perform_file_restoration() {
  if [ -f /tmp/restore-files-dynamix-unraid-net ]; then
    echo "Restoring files..."
    
    # Process files to restore - POSIX compliant approach
    for FILE in \
      "/usr/local/emhttp/plugins/dynamix/DisplaySettings.page" \
      "/usr/local/emhttp/plugins/dynamix/Registration.page" \
      "/usr/local/emhttp/plugins/dynamix/include/DefaultPageLayout.php" \
      "/usr/local/emhttp/plugins/dynamix/include/ProvisionCert.php" \
      "/usr/local/emhttp/plugins/dynamix/include/UpdateDNS.php" \
      "/usr/local/emhttp/plugins/dynamix/include/ReplaceKey.php" \
      "/usr/local/emhttp/plugins/dynamix/include/Wrappers.php" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/Downgrade.page" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/Update.page" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/include/ShowChanges.php" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/showchanges" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/unraidcheck" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/include/UnraidCheck.php" \
      "/usr/local/emhttp/plugins/dynamix.plugin.manager/include/UnraidCheckExec.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/Connect.page" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/MyServers.page" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/Registration.page" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/myservers1.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/myservers2.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/data/server-state.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/reboot-details.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/translations.php" \
      "/usr/local/emhttp/plugins/dynamix.my.servers/include/web-components-extractor.php" \
      "/usr/local/emhttp/update.htm" \
      "/usr/local/emhttp/logging.htm" \
      "/etc/nginx/nginx.conf" \
      "/etc/rc.d/rc.nginx" \
      "/usr/share/mozilla/firefox/9n35r0i1.default/user.js"
    do
      [ -f "$FILE-" ] && mv -f "$FILE-" "$FILE"
    done
    
    # Handle the unraid-components directory
    DIR=/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components
    # certain instances where the directory is not present and others where it is, ensure we delete it before we restore it
    if [ -d "$DIR" ]; then
      rm -rf "$DIR"
    fi
    if [ -d "$DIR-" ]; then
      mv -f "$DIR-" "$DIR"
    fi

    # If we're only doing restoration (during install), we're done
    if [ "$MODE" = "restore" ]; then
      rm -f /tmp/restore-files-dynamix-unraid-net
    fi
  fi
}

# Handle flash backup deactivation and Connect signout
perform_connect_cleanup() {
  printf "\n**********************************\n"
  printf "🧹 CLEANING UP - may take a minute\n"
  printf "**********************************\n"
  
  # Handle git-based flash backups
  if [ -f "/boot/.git" ]; then
    if [ -f "/etc/rc.d/rc.flash_backup" ]; then
      printf "\nStopping flash backup service. Please wait...\n"
      /etc/rc.d/rc.flash_backup stop >/dev/null 2>&1
    fi
    
    if [ -f "/usr/local/emhttp/plugins/dynamix.my.servers/include/UpdateFlashBackup.php" ]; then
      printf "\nDeactivating flash backup. Please wait...\n"
      /usr/bin/php /usr/local/emhttp/plugins/dynamix.my.servers/include/UpdateFlashBackup.php deactivate
    fi
  fi
  
  # Check if myservers.cfg exists
  if [ -f "/boot/config/plugins/dynamix.my.servers/myservers.cfg" ]; then
    # Stop unraid-api
    printf "\nStopping unraid-api. Please wait...\n"
    output=$(/etc/rc.d/rc.unraid-api stop --delete 2>&1)
    if [ -z "$output" ]; then
      echo "Waiting for unraid-api to stop..."
      sleep 5  # Give it time to stop
    fi
    echo "Stopped unraid-api: $output"
    
    # Sign out of Unraid Connect (we'll use curl directly from shell)
    # We need to extract the username from myservers.cfg and the registration key
    if grep -q 'username' "/boot/config/plugins/dynamix.my.servers/myservers.cfg"; then
      printf "\nSigning out of Unraid Connect\n"
      # Check if regFILE exists in var.ini
      if [ -f "/var/local/emhttp/var.ini" ]; then
        regfile=$(grep "regFILE" "/var/local/emhttp/var.ini" | cut -d= -f2)
        if [ -n "$regfile" ] && [ -f "$regfile" ]; then
          # Base64 encode the key file and send to server
          encoded_key=$(base64 "$regfile" | tr -d '\n')
          if [ -n "$encoded_key" ]; then
            curl -s -X POST "https://keys.lime-technology.com/account/server/unregister" \
              -d "keyfile=$encoded_key" >/dev/null 2>&1
          fi
        fi
      fi
    fi
    
    # Remove myservers.cfg
    rm -f /boot/config/plugins/dynamix.my.servers/myservers.cfg
    
    # Reload nginx to disable Remote Access
    printf "\n⚠️ Reloading Web Server. If this window stops updating for two minutes please close it.\n"
    /etc/rc.d/rc.nginx reload >/dev/null 2>&1
  fi
}

# Full cleanup function - runs only during removal
perform_full_cleanup() {
  # Clean up Connect and Flash Backup services
  perform_connect_cleanup
  
  # Stop and remove the API
  if [ -e /etc/rc.d/rc.unraid-api ]; then
    # Stop flash backup
    /etc/rc.d/rc.flash_backup stop >/dev/null 2>&1
    # Stop the api gracefully
    /etc/rc.d/rc.unraid-api stop >/dev/null 2>&1
    # Stop newer clients
    unraid-api stop
    # Kill any processes
    pid_list=$(pidof unraid-api 2>/dev/null) || true
    [ -n "$pid_list" ] && kill -9 $pid_list
    # Find all PIDs referencing main.js and kill them
    node_pids=$(pgrep -f "node /usr/local/unraid-api/dist/main.js" 2>/dev/null) || true
    [ -n "$node_pids" ] && echo "$node_pids" | xargs kill -9
    # Clean up files
    rm -rf /usr/local/unraid-api
    rm -rf /var/run/unraid-api.sock
    rm -rf /usr/.pnpm-store
  fi

  # Delete plugin files and cleanup
  rm -f /boot/config/plugins/dynamix.my.servers/.gitignore
  rm -f /etc/rc.d/rc.unraid-api
  rm -f /etc/rc.d/rc.flash_backup
  rm -rf /usr/local/sbin/unraid-api
  rm -rf /usr/local/bin/unraid-api
  rm -rf /usr/local/emhttp/plugins/dynamix.unraid.net
  rm -rf /usr/local/emhttp/plugins/dynamix.unraid.net.staging
  rm -f /etc/rc.d/rc6.d/K10_flash_backup
  rm -f /var/log/gitcount
  rm -f /var/log/gitflash
  rm -f /var/log/gitratelimit
  rm -f /usr/local/emhttp/state/flashbackup.ini
  rm -f /usr/local/emhttp/state/myservers.cfg
  
  # Delete any legacy files that may exist
  rm -rf /boot/config/plugins/dynamix.my.servers/libvirt.node
  rm -rf /boot/config/plugins/dynamix.my.servers/segfault-handler.node
  rm -rf /boot/config/plugins/dynamix.my.servers/wc
  rm -f /boot/config/plugins/Unraid.net/unraid-api.tgz
  rm -f /boot/config/plugins/Unraid.net/.gitignore
  rm -f /boot/config/plugins/dynamix.my.servers/unraid-api.tgz
  rm -rf /boot/config/plugins/Unraid.net/webComps
  rm -rf /boot/config/plugins/Unraid.net/wc
  rm -f /usr/local/emhttp/webGui/javascript/vue.js
  rm -f /usr/local/emhttp/webGui/javascript/vue.min.js
  rm -rf /usr/local/emhttp/webGui/webComps
  rm -rf /usr/local/emhttp/webGui/wc
  
  # Clean up our optional makestate modifications in rc.nginx (on 6.9 and 6.10.0-rc[12])
  sed -i '/scripts\/makestate/d' /etc/rc.d/rc.nginx
  # Clean up extra origin for robots.txt
  sed -i '/#robots.txt any origin/d' /etc/rc.d/rc.nginx
  
  # Clean up temporary flag file
  rm -f /tmp/restore-files-dynamix-unraid-net
}

# Main execution flow based on mode
case "$MODE" in
  'restore')
    # Only perform file restoration
    perform_file_restoration
    ;;
  'cleanup')
    # Perform file restoration first, then full cleanup
    perform_file_restoration
    perform_full_cleanup
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [restore|cleanup]"
    exit 1
    ;;
esac 