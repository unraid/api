# Unraid Connect API plugin

The API hosts the vendored `presence-connector` executable. Go owns presence reconnects,
tunnel transport, certificate issuance and renewal, and overview transmission. The API
starts or stops the process when settings or identity change. It does not restart an
exited connector automatically.

## Settings and overview data

The dedicated **Unraid Connect** page at `/Settings/ConnectTunnel` exposes three choices:

- **Manage myunraid.net certificate** defaults on only when a myunraid.net certificate
  already exists. An explicit saved opt-out takes precedence.
- **Allow tunneled remote access** defaults off and requires certificate management,
  strict HTTPS, and a valid certificate when first enabled. The tunnel does not use port forwarding.
- **Share server overview** defaults off. A collapsed preview shows the data that would be shared.

The page uses `connectTunnelSettings` and `updateConnectTunnelSettings` with typed
feature flags and structured status. These controls are not part of the unified API
settings JSONForms schema. API authentication and SSO settings stay on their existing page.

**Migrate certificate now** requests an early move to a private key generated on the
server. The confirmation names the installed certificate and is bound to the current
account, settings, and connector process. The API sends one command over stdin; Go owns
issuance, deadlines, and installation. Interrupted commands are never replayed. The page
reports failed and partial installations separately, and the API refreshes HTTPS after
either complete or partial installation. Check HTTPS access after replacement.

The connector checks the certificate against the exact domain assigned by the selected
control plane before applying its normal renewal window. A production certificate does
not satisfy a preview assignment, or the reverse. A mismatch requests the assigned
certificate without deleting the installed bundle first. Matching healthy certificates
still keep their normal renewal schedule. An explicit migration confirmation cannot
authorize a domain change; automatic provisioning handles the selected assignment.

Manual port forwarding and UPnP remain in the **Remote Access** section of API Settings.
Existing forwarding preferences and ports are preserved during migration. The plugin
continues to create, renew, and remove UPnP leases. Direct access and tunnel access can
be enabled independently; disabling one does not disable the other. On-demand access
uses the tunnel rather than the retired cloud transport.

The API maps local state to the pinned `server-overview/v1` contract in
`src/tunnel/contracts/server-overview-v1.schema.json`. It writes
`server-state-v1.json` beside `connect.json` using an atomic rename and mode `0600`.
The file contains only the contract fields: OS version, boot time, server name,
logical storage pools and drives, capacity and warnings, and access URLs. Hardware
identifiers, credentials, device paths, and SMART data are excluded.

The API refreshes this input file every five minutes. Go reads and transmits it.
Disabling sharing first stops the process and clears the local file, then requests
remote deletion. Failed deletion remains visible as pending and retries on the next
refresh. Sign-out stops the process, clears local shared data, and retains preferences.
It does not claim that remote data was deleted.

## Runtime configuration

Set `CONNECT_CONTROL_PLANE_URL` to the intended HTTPS origin before enabling a feature.
There is no implicit production endpoint. `CONNECT_PRESENCE_EVENT_PUBLIC_KEYS` supplies
the Go binary's JSON public-key ring for entitlement events. Account credentials come
from the existing Connect sign-in flow and are passed only in the child environment.
No account key is placed in command arguments, the overview file, or settings output.

Default runtime paths are:

| Purpose            | Path                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| Executable         | `/usr/local/libexec/unraid-connect/presence-connector`                 |
| Certificate bundle | `/boot/config/ssl/certs/certificate_bundle.pem`                        |
| Overview file      | `/boot/config/plugins/dynamix.my.servers/configs/server-state-v1.json` |

For isolated local testing, the API accepts `CONNECT_CONNECTOR_PATH`,
`CONNECT_CERT_BUNDLE_PATH`, `CONNECT_STATE_PATH`, and `CONNECT_CERT_PROVISIONER_PATH`.
The certificate reload command is fixed to `/etc/rc.d/rc.nginx reload`.

## Installation patches

When Connect is installed and the API starts, the API file modification service applies
three reversible patches. They disable the legacy PHP certificate writer, replace its
provision/delete buttons with a settings link, and add the opted-in tunnel hostname to
nginx's HTTPS server names. The connector refuses certificate ownership if the legacy
writer patch is absent. Existing certificates are preserved. API shutdown restores the
patched files; disabling Connect restores them on the next API startup.

The nginx patch only accepts a tunnel hostname covered by the installed certificate.
The API persists tunnel settings before reloading nginx. An existing tunnel can start
with an expired or missing certificate so Go can renew it.

## Local builds and tests

The plugin package includes a pinned Linux amd64 executable and provenance manifest.
Rebuild it without network access from a clean local checkout at the pinned revision:

```sh
plugin/scripts/vendor-connect-connector.sh /path/to/connect-tunnel
pnpm --filter unraid-api-plugin-connect run clean
pnpm --filter unraid-api-plugin-connect run build
pnpm --filter unraid-api-plugin-connect exec vitest run
```

The vendor script verifies the toolchain, binary checksum, and shared-contract checksum.
The TXZ builder checks the binary before packaging. Tests use temporary files and a
loopback service; they do not establish a live Connect tunnel.
