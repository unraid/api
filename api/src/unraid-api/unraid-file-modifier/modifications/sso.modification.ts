import type { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';
import { backupFile, restoreFile } from '@app/utils';

export default class SSOFileModification implements FileModification {
    id: string = 'sso';
    logger: Logger;
    loginFilePath: string = '/usr/local/emhttp/plugins/dynamix/include/.login.php';
    constructor(logger: Logger) {
        this.logger = logger;
    }

    async apply(): Promise<void> {
        // Define the new PHP function to insert
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
        }
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

        // Restore the original file if exists
        await restoreFile(this.loginFilePath, false);
        // Backup the original content
        await backupFile(this.loginFilePath, true);

        // Read the file content
        let fileContent = await readFile(this.loginFilePath, 'utf-8');

        // Add new function after the opening PHP tag (<?php)
        fileContent = fileContent.replace(/<\?php\s*(\r?\n|\r)*/, `<?php\n\n${newFunction}\n`);

        // Replace the old function call with the new function name
        const functionCallPattern = /!verifyUsernamePassword\(\$username, \$password\)/g;
        fileContent = fileContent.replace(
            functionCallPattern,
            '!verifyUsernamePasswordAndSSO($username, $password)'
        );

        // Inject the PHP include tag after the closing </form> tag
        fileContent = fileContent.replace(/<\/form>/i, `</form>\n${tagToInject}`);

        // Write the updated content back to the file
        await writeFile(this.loginFilePath, fileContent);

        this.logger.log('Login Function replaced successfully.');
    }
    async rollback(): Promise<void> {
        const restored = await restoreFile(this.loginFilePath, false);
        if (restored) {
            this.logger.debug('SSO login file restored.');
        } else {
            this.logger.debug('No SSO login file backup found.');
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const { getters } = await import('@app/store/index');
        const hasConfiguredSso = getters.config().remote.ssoSubIds.length > 0;
        return hasConfiguredSso
            ? { shouldApply: true, reason: 'SSO is configured - enabling support in .login.php' }
            : { shouldApply: false, reason: 'SSO is not configured' };
    }
}
