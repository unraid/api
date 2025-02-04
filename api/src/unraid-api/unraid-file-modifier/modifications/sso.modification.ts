import { readFile } from 'node:fs/promises';

import { createPatch } from 'diff';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';

export default class SSOFileModification extends FileModification {
    id: string = 'sso';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/.login.php';

    protected async generatePatch(overridePath?: string): Promise<string> {
        // Define the new PHP function to insert
        /* eslint-disable no-useless-escape */
        const newFunction = `
function verifyUsernamePasswordAndSSO(string $username, string $password): bool {
    if ($username != "root") return false;

    $output = exec("/usr/bin/getent shadow $username");
    if ($output === false) return false;
    $credentials = explode(":", $output);
    $valid = password_verify($password, $credentials[1]);
    if ($valid) {
        return true;
    }
    // We may have an SSO token, attempt validation
    if (strlen($password) > 800) {
        $safePassword = escapeshellarg($password);
        if (!preg_match('/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/', $password)) {
            my_logger("SSO Login Attempt Failed: Invalid token format");
            return false;
        }
        $safePassword = escapeshellarg($password);
        $response = exec("/usr/local/bin/unraid-api sso validate-token $safePassword", $output, $code);
        my_logger("SSO Login Attempt: $response");
        if ($code === 0 && $response && strpos($response, '"valid":true') !== false) {
            return true;
        }
    }
    return false;
}`;

        const tagToInject =
            '<?php include "$docroot/plugins/dynamix.my.servers/include/sso-login.php"; ?>';

        // Read the file content
        const originalContent = await readFile(this.filePath, 'utf-8');

        // Create modified content
        let newContent = originalContent;

        // Add new function after the opening PHP tag
        newContent = newContent.replace(/<\?php\s*(\r?\n|\r)*/, `<?php\n\n${newFunction}\n`);

        // Replace the old function call
        newContent = newContent.replace(
            /!verifyUsernamePassword\(\$username, \$password\)/g,
            '!verifyUsernamePasswordAndSSO($username, $password)'
        );

        // Inject the PHP include tag
        newContent = newContent.replace(/<\/form>/i, `</form>\n${tagToInject}`);

        // Create and return the patch
        const patch = createPatch(overridePath ?? this.filePath, originalContent, newContent, 'original', 'modified');
        return patch;
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const { getters } = await import('@app/store/index');
        const hasConfiguredSso = getters.config().remote.ssoSubIds.length > 0;
        return hasConfiguredSso
            ? { shouldApply: true, reason: 'SSO is configured - enabling support in .login.php' }
            : { shouldApply: false, reason: 'SSO is not configured' };
    }
}
