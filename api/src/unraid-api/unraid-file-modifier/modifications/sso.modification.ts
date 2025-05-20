import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class SSOFileModification extends FileModification {
    id: string = 'sso';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/.login.php';

    protected async generatePatch(overridePath?: string): Promise<string> {
        // Define the new PHP function to insert
        /* eslint-disable no-useless-escape */
        const newFunction = /** PHP */ `
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
        if (!preg_match('/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/', $password)) {
            my_logger("SSO Login Attempt Failed: Invalid token format");
            return false;
        }
        $safePassword = escapeshellarg($password);

        $output = array();
        exec("/etc/rc.d/rc.unraid-api sso validate-token $safePassword 2>&1", $output, $code);
        my_logger("SSO Login Attempt Code: $code");
        my_logger("SSO Login Attempt Response: " . print_r($output, true));

        if ($code !== 0) {
            return false;
        }

        if (empty($output)) {
            return false;
        }

        try {
            // Split on first { and take everything after it
            $jsonParts = explode('{', $output[0], 2);
            if (count($jsonParts) < 2) {
                my_logger("SSO Login Attempt Failed: No JSON found in response");
                return false;
            }
            $response = json_decode('{' . $jsonParts[1], true);
            if (isset($response['valid']) && $response['valid'] === true) {
                return true;
            }
        } catch (Exception $e) {
            my_logger("SSO Login Attempt Exception: " . $e->getMessage());
            return false;
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
        return this.createPatchWithDiff(overridePath ?? this.filePath, originalContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const { getters } = await import('@app/store/index.js');

        const isUnraidVersionGreaterThanOrEqualTo72 =
            await this.isUnraidVersionGreaterThanOrEqualTo('7.2.0');
        if (isUnraidVersionGreaterThanOrEqualTo72) {
            return {
                shouldApply: false,
                reason: 'Skipping for Unraid 7.2 or later, where the Unraid API is integrated.',
            };
        }
        const hasConfiguredSso = getters.config().remote.ssoSubIds.length > 0;
        return hasConfiguredSso
            ? { shouldApply: true, reason: 'SSO is configured - enabling support in .login.php' }
            : { shouldApply: false, reason: 'SSO is not configured' };
    }
}
