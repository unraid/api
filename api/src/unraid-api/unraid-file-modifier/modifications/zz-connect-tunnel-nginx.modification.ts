import { readFile } from 'node:fs/promises';

import ConnectCertificateProvisioningModification from '@app/unraid-api/unraid-file-modifier/modifications/connect-certificate-provisioning.modification.js';

export default class ConnectTunnelNginxModification extends ConnectCertificateProvisioningModification {
    override filePath = '/etc/rc.d/rc.nginx';
    override id = 'connect-tunnel-nginx';

    protected override async generatePatch(overridePath?: string) {
        const original = await readFile(this.filePath, 'utf8');
        const anchor = '      # wildcard LE certificate';
        if (!original.includes(anchor)) throw new Error('Unrecognized nginx certificate configuration');
        const replacement = original.replace(
            anchor,
            `${anchor}
      # Add only the opted-in, certificate-covered Connect hostnames.
      local CONNECT_TUNNEL_CONFIG="/boot/config/plugins/dynamix.my.servers/configs/connect.json"
      if [[ -e /boot/config/preview/enabled ]]; then
        CONNECT_TUNNEL_CONFIG="/boot/config/preview/plugins/dynamix.my.servers/configs/connect.json"
      fi
      local CONNECT_TUNNEL_HOST
      while IFS= read -r CONNECT_TUNNEL_HOST; do
        if [[ $CONNECT_TUNNEL_HOST =~ ^(tun|srv)-[a-f0-9]{32}\\.[a-z0-9-]+\\.(preview\\.)?myunraid\\.net$ && \${CONNECT_TUNNEL_HOST#*.} == \${CERTNAME#*.} ]]; then
          SERVER_NAMES+=("$CONNECT_TUNNEL_HOST")
        fi
      done < <(jq -r 'select(.certificateManagementEnabled == true and .tunnelRemoteAccessEnabled == true and (.apikey | length) > 0) | [(.tunnelHostnames // [])[], .tunnelHostname] | unique[] | select(type == "string")' "$CONNECT_TUNNEL_CONFIG" 2>/dev/null)`
        );
        return this.createPatchWithDiff(overridePath ?? this.filePath, original, replacement);
    }
    override async shouldApply() {
        return { ...(await super.shouldApply()), effects: ['nginx:reload' as const] };
    }
}
