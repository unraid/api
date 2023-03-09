#!/bin/bash

# download the JavaScript web components e.g. the user profile component
JS_DL_SERVER=https://registration.unraid.net
JS_FLASH_DEST=/boot/config/plugins/dynamix.my.servers/webComps/
JS_FINAL_DEST=/usr/local/emhttp/plugins/dynamix.my.servers/webComps/
JS_FILE=unraid.min.js

rm -f "/tmp/${JS_FILE}.tmp1"
rm -f "/tmp/${JS_FILE}.tmp2"
WGET_LIMIT=" -t 1 -T 20 "
# shellcheck disable=SC2086
wget ${WGET_LIMIT} -q --compression=auto --no-cache "${JS_DL_SERVER}/webComps/${JS_FILE}" -O "/tmp/${JS_FILE}.tmp1" &>/dev/null
if [[ -f "/tmp/${JS_FILE}.tmp1" && -s "/tmp/${JS_FILE}.tmp1" ]]; then
  # simple validatation that the file was downloaded correctly
  if grep -q "sourceMappingURL=unraid.min.js.map" "/tmp/${JS_FILE}.tmp1"; then
    # remove source mapping from js
    head -n -1 "/tmp/${JS_FILE}.tmp1" >"/tmp/${JS_FILE}.tmp2"
    rm "/tmp/${JS_FILE}.tmp1"
  fi
fi

# bail if file wasn't downloaded
[[ ! -f "/tmp/${JS_FILE}.tmp2" ]] && exit 0

# bail if downloaded file and existing file are the same
if cmp -s "/tmp/${JS_FILE}.tmp2" "${JS_FINAL_DEST}${JS_FILE}"; then
  rm -f "/tmp/${JS_FILE}.tmp2"
  exit 0
fi

# save new file
mkdir -p "${JS_FINAL_DEST}" && mv "/tmp/${JS_FILE}.tmp2" "${JS_FINAL_DEST}${JS_FILE}"
mkdir -p "${JS_FLASH_DEST}" && cp "${JS_FINAL_DEST}${JS_FILE}" "${JS_FLASH_DEST}${JS_FILE}"
