#!/bin/bash
# passes `shellcheck` and `shfmt -i 2`

[[ "$1" == "s" ]] && env=staging
[[ "$1" == "p" ]] && env=production
[[ -z "${env}" ]] && echo "usage: [s|p]" && exit 1

DIR=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")
MAINDIR=$(dirname "$(dirname "${DIR}")")
tmpdir=/tmp/tmp.$((RANDOM * 19318203981230 + 40))
pluginSrc=$(basename "${DIR}")
plugin="${pluginSrc}"
[[ "${env}" == "staging" ]] && plugin="${plugin}.staging" && cp "${MAINDIR}/plugins/${pluginSrc}.plg" "${MAINDIR}/plugins/${plugin}.plg"
version=$(date +"%Y.%m.%d.%H%M")
plgfile="${MAINDIR}/plugins/${plugin}.plg"
txzfile="${MAINDIR}/archive/${plugin}-${version}.txz"

# create txz package
mkdir -p "$(dirname "${txzfile}")"
mkdir -p "${tmpdir}"
# shellcheck disable=SC2046
cp --parents -f $(find . -type f ! \( -iname ".DS_Store" -o -iname "pkg_build.sh" -o -iname "makepkg" -o -iname "explodepkg" -o -iname "sftp-config.json" \)) "${tmpdir}/"
cd "${tmpdir}" || exit 1
if [[ "${env}" == "staging" ]]; then
  # create README.md for staging plugin
  mv "${tmpdir}/usr/local/emhttp/plugins/dynamix.unraid.net" "${tmpdir}/usr/local/emhttp/plugins/dynamix.unraid.net.staging"
  sed -i "s@\*\*My Servers\*\*@\*\*My Servers \(staging\)\*\*@" "${tmpdir}/usr/local/emhttp/plugins/dynamix.unraid.net.staging/README.md"
  sed -i "s@dynamix.unraid.net.plg@dynamix.unraid.net.staging.plg@" "${tmpdir}/usr/local/emhttp/plugins/dynamix.my.servers/MyServers.page"
fi
chmod 0755 -R .
sudo chown root:root -R .
sudo "${MAINDIR}/source/dynamix.unraid.net/makepkg" -l y -c y "${txzfile}"
sudo rm -rf "${tmpdir}"
md5=$(md5sum "${txzfile}" | cut -f 1 -d ' ')
echo "MD5: ${md5}"
sha256=$(sha256sum "${txzfile}" | cut -f 1 -d ' ')
echo "SHA256: ${sha256}"

# test txz package
mkdir -p "${tmpdir}"
cd "${tmpdir}" || exit 1
RET=$(sudo "${MAINDIR}/source/dynamix.unraid.net/explodepkg" "${txzfile}" 2>&1 >/dev/null)
sudo rm -rf "${tmpdir}"
[[ "${RET}" != "" ]] && echo "Error: invalid txz package created: ${txzfile}" && exit 1
cd "${DIR}" || exit 1

# define vars for plg
pluginURL="https://unraid-dl.sfo2.cdn.digitaloceanspaces.com/unraid-api/&name;.plg"
downloadserver="https://unraid-dl.sfo2.cdn.digitaloceanspaces.com"
js_dl_server="https://registration.unraid.net"
if [[ "${env}" == "staging" ]]; then
  pluginURL="https://unraid-dl.sfo2.digitaloceanspaces.com/unraid-api/&name;.plg"
  downloadserver="https://unraid-dl.sfo2.digitaloceanspaces.com"
  js_dl_server="https://registration-dev.unraid.net"
fi

# update plg file
sed -i -E "s#(ENTITY name\s*)\".*\"#\1\"${plugin}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY env\s*)\".*\"#\1\"${env}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY version\s*)\".*\"#\1\"${version}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY pluginURL\s*)\".*\"#\1\"${pluginURL}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY MD5\s*)\".*\"#\1\"${md5}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY SHA256\s*)\".*\"#\1\"${sha256}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY downloadserver\s*)\".*\"#\1\"${downloadserver}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY js_dl_server\s*)\".*\"#\1\"${js_dl_server}\"#g" "${plgfile}"

# set from environment vars
sed -i -E "s#(ENTITY API_version\s*)\".*\"#\1\"${API_VERSION}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY API_MD5\s*)\".*\"#\1\"${API_MD5}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY API_SHA256\s*)\".*\"#\1\"${API_SHA256}\"#g" "${plgfile}"

# add changelog for major versions
# sed -i "/<CHANGES>/a ###${version}\n" ${plgfile}

echo
grep -E "ENTITY (name|env|version|MD5|SHA256|node_api_version)" "${plgfile}"
echo
echo "${env} plugin: ${plgfile}"
echo "${env} txz:    ${txzfile}"
