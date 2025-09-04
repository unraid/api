#!/bin/sh
# Script to handle cleanup operations during removal
# NOTE: an inline copy of this script exists in dynamix.unraid.net.plg for Unraid 6.12.14 and earlier
# When updating this script, be sure to update the inline copy as well.

# Get the operation mode
MODE="${1:-cleanup}"

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
  
  # Check if connect.json or myservers.cfg exists
  if [ -f "/boot/config/plugins/dynamix.my.servers/configs/connect.json" ] || [ -f "/boot/config/plugins/dynamix.my.servers/myservers.cfg" ]; then
    # Stop unraid-api
    printf "\nStopping unraid-api. Please wait...\n"
    output=$(/etc/rc.d/rc.unraid-api stop --delete 2>&1)
    if [ -z "$output" ]; then
      echo "Waiting for unraid-api to stop..."
      sleep 5  # Give it time to stop
    fi
    echo "Stopped unraid-api: $output"
    
    # Sign out of Unraid Connect (we'll use curl directly from shell)
    # We need to extract the username from connect.json or myservers.cfg and the registration key
    has_username=false
    
    # Check connect.json first (newer format)
    if [ -f "/boot/config/plugins/dynamix.my.servers/configs/connect.json" ] && command -v jq >/dev/null 2>&1; then
      username=$(jq -r '.username' "/boot/config/plugins/dynamix.my.servers/configs/connect.json" 2>/dev/null)
      if [ -n "$username" ] && [ "$username" != "null" ]; then
        has_username=true
      fi
    fi
    
    # Fallback to myservers.cfg (legacy format)
    if [ "$has_username" = false ] && [ -f "/boot/config/plugins/dynamix.my.servers/myservers.cfg" ]; then
      if grep -q 'username' "/boot/config/plugins/dynamix.my.servers/myservers.cfg"; then
        has_username=true
      fi
    fi
    
    if [ "$has_username" = true ]; then
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
    
    # Remove config files
    rm -f /boot/config/plugins/dynamix.my.servers/myservers.cfg
    rm -f /boot/config/plugins/dynamix.my.servers/configs/connect.json
    
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
}

# Main execution flow based on mode
case "$MODE" in
  'cleanup')
    perform_full_cleanup
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [cleanup]"
    exit 1
    ;;
esac 
