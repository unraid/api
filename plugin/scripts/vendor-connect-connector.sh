#!/usr/bin/env bash
set -euo pipefail

source_repo="${1:?Usage: vendor-connect-connector.sh /path/to/local/connect-tunnel}"
plugin_dir="$(cd "$(dirname "$0")/.." && pwd)"
destination="$plugin_dir/source/dynamix.unraid.net/usr/local/libexec/unraid-connect"
manifest="$destination/presence-connector.json"
revision="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["revision"])' "$manifest")"
toolchain="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["go"])' "$manifest")"

test "$(git -C "$source_repo" rev-parse HEAD)" = "$revision" || {
  echo "Source checkout must match the pinned revision: $revision" >&2
  exit 1
}
test -z "$(git -C "$source_repo" status --porcelain --untracked-files=normal)" || {
  echo "Source checkout must be clean." >&2
  exit 1
}
test "$(go env GOVERSION)" = "$toolchain" || {
  echo "Build requires $toolchain." >&2
  exit 1
}

output="$(mktemp -d)"
trap 'rm -rf "$output"' EXIT
(
  cd "$source_repo/relay"
  GOPROXY=off GOSUMDB=off GOTOOLCHAIN=local CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags='-s -w' -o "$output/presence-connector" ./cmd/presence-connector
)
python3 - "$manifest" "$output/presence-connector" "$source_repo/control-plane/contracts/server-overview/v1.schema.json" "$plugin_dir/../packages/unraid-api-plugin-connect/src/tunnel/contracts/server-overview-v1.schema.json" <<'PY'
import hashlib, json, pathlib, sys
expected = json.loads(pathlib.Path(sys.argv[1]).read_text())["sha256"]
actual = hashlib.sha256(pathlib.Path(sys.argv[2]).read_bytes()).hexdigest()
if actual != expected:
    raise SystemExit("Connector checksum differs from the pinned artifact")
contract_hash = json.loads(pathlib.Path(sys.argv[1]).read_text())["overviewSchemaSha256"]
for path in sys.argv[3:]:
    if hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest() != contract_hash:
        raise SystemExit("Overview contract differs from the pinned connector contract")
PY
python3 - "$manifest" "$source_repo/relay/internal/gateway/testdata/gateway-legacy-oidc-v3.json" "$plugin_dir/../packages/unraid-api-plugin-connect/src/tunnel/fixtures/gateway-legacy-oidc-v3.json" <<'PYCONTRACT'
import hashlib, json, pathlib, sys
expected = json.loads(pathlib.Path(sys.argv[1]).read_text())["oidcConfigContractSha256"]
for path in sys.argv[2:]:
    if hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest() != expected:
        raise SystemExit("OIDC configuration contract differs from the pinned connector contract")
PYCONTRACT
install -m 755 "$output/presence-connector" "$destination/presence-connector"
