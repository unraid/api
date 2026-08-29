import { readFile } from 'node:fs/promises';

import ConnectCertificateProvisioningModification from '@app/unraid-api/unraid-file-modifier/modifications/connect-certificate-provisioning.modification.js';

export default class ConnectCertificateSettingsModification extends ConnectCertificateProvisioningModification {
    override filePath = '/usr/local/emhttp/plugins/dynamix/ManagementAccess.page';
    override id = 'connect-certificate-settings';

    protected override async generatePatch(overridePath?: string) {
        const original = await readFile(this.filePath, 'utf8');
        const controls =
            /: <span class="inline-block">\s*<button[^\n]*name="changePorts" value="Provision"[^\n]*\n\s*<button[^\n]*name="changePorts" value="Delete"[^\n]*\n\s*<\/span>\s*<span class="inline-block"><\?=\$disabled_provision_msg\?><\/span>/;
        if (!controls.test(original)) throw new Error('Unrecognized certificate controls');
        const replacement = original.replace(
            controls,
            ': <a href="/Settings/ConnectTunnel">_(Manage certificate in Unraid API Settings)_</a>'
        );
        return this.createPatchWithDiff(overridePath ?? this.filePath, original, replacement);
    }
}
