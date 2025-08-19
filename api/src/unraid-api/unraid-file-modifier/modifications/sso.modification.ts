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
    if (strlen($password) > 500) {
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
        const superShouldApply = await super.shouldApply();
        if (!superShouldApply.shouldApply) {
            return superShouldApply;
        }

        // Always apply SSO modification to support OIDC authentication
        // OIDC providers are now configured through the web interface
        // and the modification is needed for the authentication flow to work
        return {
            shouldApply: true,
            reason: 'SSO/OIDC support is always enabled for authentication',
        };
    }
}
