#!/bin/sh
# Script to handle file patches

# Patch nginx config if needed
NGINX_CHANGED=0
FILE=/etc/nginx/nginx.conf
if grep -q "SAMEORIGIN" "${FILE}" >/dev/null 2>&1; then
  cp -p "$FILE" "$FILE-" 
  OLD="add_header X-Frame-Options 'SAMEORIGIN';" 
  NEW="add_header Content-Security-Policy \"frame-ancestors 'self' https://connect.myunraid.net/\";"
  sed -i "s|${OLD}|${NEW}|" "${FILE}"
  NGINX_CHANGED=1
fi

# Patch robots.txt handling
FILE=/etc/rc.d/rc.nginx
if ! grep -q "#robots.txt any origin" "${FILE}" >/dev/null 2>&1; then
  cp -p "$FILE" "$FILE-" 
  FIND="location = \/robots.txt {"
  # escape tabs and spaces
  ADD="\t    add_header Access-Control-Allow-Origin *; #robots.txt any origin"
  # shell-safe: pass ADD via printf to preserve escapes
  sed -i "/${FIND}/a $(printf '%s\n' "${ADD}")" "${FILE}"
  NGINX_CHANGED=1
fi

# Remove keys.limetechnology.com from hosts file
if grep -q "keys.lime-technology.com" /etc/hosts >/dev/null 2>&1; then 
  sed -i "/keys.lime-technology.com/d" /etc/hosts >/dev/null 2>&1
fi

# Fix update.htm to work in an iframe
FILE=/usr/local/emhttp/update.htm
if [ -f "${FILE}" ] && grep -q "top.document" "${FILE}" >/dev/null 2>&1; then
  cp -p "$FILE" "$FILE-"
  sed -i 's|top.document|parent.document|gm' "${FILE}"
fi

# Fix logging.htm to work in an iframe
FILE=/usr/local/emhttp/logging.htm
if [ -f "${FILE}" ] && grep -q "top.Shadowbox" "${FILE}" >/dev/null 2>&1; then
  cp -p "$FILE" "$FILE-"
  sed -i 's|top.Shadowbox|parent.Shadowbox|gm' "${FILE}"
fi

# Relax restrictions on built-in Firefox
FIREFOX_DIR=/usr/share/mozilla/firefox
# Find the default profile directory (may change in future versions)
PROFILE_DIR=$(find "$FIREFOX_DIR" -name "*.default" -type d 2>/dev/null | head -n 1)

if [ -z "$PROFILE_DIR" ]; then
  echo "Firefox default profile directory not found, skipping Firefox configuration"
else
  FILE="$PROFILE_DIR/user.js"
  if [ -f "$FILE" ]; then
    cp -p "$FILE" "$FILE-"
    # Append settings if they don't exist
    grep -q "privacy.firstparty.isolate" "$FILE" || echo 'user_pref("privacy.firstparty.isolate", false);' >> "$FILE"
    grep -q "javascript.options.asmjs" "$FILE" || echo 'user_pref("javascript.options.asmjs", true);' >> "$FILE"
    grep -q "javascript.options.wasm" "$FILE" || echo 'user_pref("javascript.options.wasm", true);' >> "$FILE"
    echo "Updated Firefox preferences in $FILE"
  fi
fi

# Move settings on flash drive
CFG_OLD=/boot/config/plugins/Unraid.net
CFG_NEW=/boot/config/plugins/dynamix.my.servers
[ -d "$CFG_OLD" ] && [ ! -d "$CFG_NEW" ] && mv "$CFG_OLD" "$CFG_NEW"

# Reload nginx if needed
if [ "$NGINX_CHANGED" = "1" ] && /etc/rc.d/rc.nginx status >/dev/null 2>&1; then
  echo "Reloading web server to apply changes"
  /etc/rc.d/rc.nginx reload >/dev/null 2>&1
fi 