import { readFile } from 'node:fs/promises';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class ConnectCertificateProvisioningModification extends FileModification {
    filePath = '/usr/local/emhttp/plugins/dynamix/include/ProvisionCert.php';
    id = 'connect-certificate-provisioning';

    protected override getPathToAppliedPatch(target = this.filePath) {
        return `${target}.connect.patch`;
    }
    async shouldApply() {
        const installed =
            this.configService?.get<string[]>('api.plugins', []).includes('unraid-api-plugin-connect') ??
            false;
        return installed
            ? super.shouldApply({ checkOsVersion: false })
            : { shouldApply: false, reason: 'Connect is not installed' };
    }
    protected async generatePatch(overridePath?: string) {
        const original = await readFile(this.filePath, 'utf8');
        if (!original.includes('provisionwildcard') || !original.includes('?>'))
            throw new Error('Unrecognized certificate provisioner');
        const replacement =
            original.slice(0, original.indexOf('?>') + 2) +
            `
<?php
// Certificate provisioning and renewal are owned by the installed Connect plugin.
$message = 'Manage the myunraid.net certificate on the Unraid Connect page.';
if (PHP_SAPI === 'cli') {
    fwrite(STDERR, $message.PHP_EOL);
    exit(1);
}
header('Content-Type: application/json');
http_response_code(409);
echo json_encode(['error' => $message]);
exit;
`;
        return this.createPatchWithDiff(overridePath ?? this.filePath, original, replacement);
    }
}
