#!/bin/bash
# passes `shellcheck` and `shfmt -i 2`

[[ "$1" == "s" ]] && env=staging
[[ "$1" == "p" ]] && env=production
[[ -z "${env}" ]] && echo "usage: [s|p]" && exit 1

# If we have a second parameter, it's the PR number (for Pull request builds)
[[ -n "$2" ]] && PR="$2" || PR=""

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
  sed -i "s@\*\*Unraid Connect\*\*@\*\*Unraid Connect \(staging\)\*\*@" "${tmpdir}/usr/local/emhttp/plugins/dynamix.unraid.net.staging/README.md"
  sed -i "s@dynamix.unraid.net.plg@dynamix.unraid.net.staging.plg@" "${tmpdir}/usr/local/emhttp/plugins/dynamix.my.servers/Connect.page"
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
PLUGIN_URL="https://stable.dl.unraid.net/unraid-api/\&name;.plg"
MAIN_TXZ="https://stable.dl.unraid.net/unraid-api/${plugin}-${version}.txz"
API_TGZ="https://stable.dl.unraid.net/unraid-api/unraid-api-${API_VERSION}.tgz"
NGHTTP3_TXZ="https://stable.dl.unraid.net/unraid-api/${NGHTTP3_FILENAME}"
# Check if PR is set, use a different path if so
if [[ -n "${PR}" ]]; then
  MAIN_TXZ="https://preview.dl.unraid.net/unraid-api/pr/${PR}/${plugin}-${version}.txz"
  API_TGZ="https://preview.dl.unraid.net/unraid-api/pr/${PR}/unraid-api-${API_VERSION}.tgz"
  PLUGIN_URL="https://preview.dl.unraid.net/unraid-api/pr/${PR}/${plugin}.plg"
  NGHTTP3_TXZ="https://preview.dl.unraid.net/unraid-api/pr/${PR}/${NGHTTP3_FILENAME}"
elif [[ "${env}" == "staging" ]]; then
  PLUGIN_URL="https://preview.dl.unraid.net/unraid-api/\&name;.plg"
  MAIN_TXZ="https://preview.dl.unraid.net/unraid-api/${plugin}-${version}.txz"
  API_TGZ="https://preview.dl.unraid.net/unraid-api/unraid-api-${API_VERSION}.tgz"
  NGHTTP3_TXZ="https://preview.dl.unraid.net/unraid-api/${NGHTTP3_FILENAME}"
fi

# Hardcoded to deal with the new -2 release breaking legacy Unraid versions
NODEJS_FILENAME="nodejs-20.18.0-x86_64-1.txz"
NODEJS_TXZ="https://stable.dl.unraid.net/unraid-api/dependencies/${NODEJS_FILENAME}"
NODEJS_SHA256="332f22a2a6722e9fad92b8d1eeaded228a6499b7335b2b54ee99c55b4fe49742"

# update plg file
sed -i -E "s#(ENTITY name\s*)\".*\"#\1\"${plugin}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY env\s*)\".*\"#\1\"${env}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY version\s*)\".*\"#\1\"${version}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY pluginURL\s*)\".*\"#\1\"${PLUGIN_URL}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY SHA256\s*)\".*\"#\1\"${sha256}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY MAIN_TXZ\s*)\".*\"#\1\"${MAIN_TXZ}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY API_TGZ\s*)\".*\"#\1\"${API_TGZ}\"#g" "${plgfile}"

# update node versions
sed -i -E "s#(ENTITY NODEJS_FILENAME\s*)\".*\"#\1\"${NODEJS_FILENAME}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY NODEJS_SHA256\s*)\".*\"#\1\"${NODEJS_SHA256}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY NODEJS_TXZ\s*)\".*\"#\1\"${NODEJS_TXZ}\"#g" "${plgfile}"

# update nghttp3 versions
sed -i -E "s#(ENTITY NGHTTP3_FILENAME\s*)\".*\"#\1\"${NGHTTP3_FILENAME}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY NGHTTP3_SHA256\s*)\".*\"#\1\"${NGHTTP3_SHA256}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY NGHTTP3_TXZ\s*)\".*\"#\1\"${NGHTTP3_TXZ}\"#g" "${plgfile}"

# set from environment vars
sed -i -E "s#(ENTITY API_version\s*)\".*\"#\1\"${API_VERSION}\"#g" "${plgfile}"
sed -i -E "s#(ENTITY API_SHA256\s*)\".*\"#\1\"${API_SHA256}\"#g" "${plgfile}"

# validate that all ENTITY values were replaced
required_entities=("name" "env" "version" "pluginURL" "SHA256" "MAIN_TXZ" "API_TGZ" "NODEJS_FILENAME" "NODEJS_SHA256" "NODEJS_TXZ" "NGHTTP3_FILENAME" "NGHTTP3_SHA256" "NGHTTP3_TXZ" "API_version" "API_SHA256")
validation_failed=false
for entity in "${required_entities[@]}"; do
  entity_value=$(grep -oP "ENTITY ${entity} \"\K[^\"]*" "${plgfile}" || echo "")
  if [[ -z "${entity_value}" ]]; then
    echo "Error: ENTITY ${entity} was not replaced correctly in ${plgfile}"
    validation_failed=true
  elif [[ "${entity_value}" =~ ^[[:space:]]*$ ]]; then
    echo "Error: ENTITY ${entity} has an empty value in ${plgfile}"
    validation_failed=true
  fi
done

if [[ "${validation_failed}" == "true" ]]; then
  if [[ -f "${plgfile}.bak" ]]; then
    echo "Restoring backup due to validation failure"
    mv "${plgfile}.bak" "${plgfile}"
  fi
  exit 1
fi

# add changelog for major versions
# sed -i "/<CHANGES>/a ###${version}\n" ${plgfile}

echo
grep -E "ENTITY (name|PLUGIN_URL|env|version|MD5|SHA256|node_api_version|MAIN_TXZ|API_TGZ)" "${plgfile}"
echo
echo "${env} plugin: ${plgfile}"
echo "${env} txz:    ${txzfile}"
