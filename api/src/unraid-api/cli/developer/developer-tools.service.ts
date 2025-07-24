import { Injectable, Logger } from '@nestjs/common';
import { access, readFile, unlink, writeFile } from 'fs/promises';
import * as path from 'path';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { UPDATE_SANDBOX_MUTATION } from '@app/unraid-api/cli/queries/developer.mutation.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification.js';

@Injectable()
export class DeveloperToolsService {
    private readonly modalPageFilePath =
        '/usr/local/emhttp/plugins/dynamix.my.servers/DevModalTest.page';
    private readonly loginPagePath = new SSOFileModification(new Logger(DeveloperToolsService.name))
        .filePath;
    private readonly welcomeModalInclude =
        '<?include "$docroot/plugins/dynamix.my.servers/include/welcome-modal.php"?>';
    private readonly modalPageContent = `Menu="UNRAID-OS:99"
Title="Dev Modal Test"
Icon="icon-code"
Tag="wrench"
---
<?php
/* @var DockerClient $DockerClient */
/* @var DockerUpdate $DockerUpdate */
/* @var DockerTemplates $DockerTemplates */
/* @var array $disks */
/* @var array $devs */
/* @var array $GLOBALS */
/* @var array $clocksource */

$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

require_once("$docroot/plugins/dynamix.my.servers/include/web-components-extractor.php");
$wcExtractor = new WebComponentsExtractor();
echo $wcExtractor->getScriptTagHtml();
?>

<style>
/* Ensure proper rendering in Unraid webgui */
unraid-dev-modal-test {
  display: block;
  width: 100%;
}
</style>

<div class="dev-modal-test-container">
  <unraid-dev-modal-test></unraid-dev-modal-test>
</div>`;

    constructor(
        private readonly logger: LogService,
        private readonly restartCommand: RestartCommand,
        private readonly internalClient: CliInternalClientService
    ) {}

    async setSandboxMode(enable: boolean): Promise<void> {
        try {
            const client = await this.internalClient.getClient();

            const result = await client.mutate({
                mutation: UPDATE_SANDBOX_MUTATION,
                variables: {
                    input: {
                        api: {
                            sandbox: enable,
                        },
                    },
                },
            });

            if (result.data?.updateSettings.restartRequired) {
                this.logger.info(
                    `${enable ? 'Enabling' : 'Disabling'} sandbox mode - restarting API...`
                );
                await this.restartCommand.run();
            } else {
                this.logger.info(`Sandbox mode ${enable ? 'enabled' : 'disabled'} successfully.`);
            }
        } catch (error) {
            this.logger.error('Failed to update sandbox configuration:', error);
            throw error;
        }
    }

    async enableModalTest(): Promise<void> {
        try {
            const dir = path.dirname(this.modalPageFilePath);

            // Check if directory exists
            try {
                await access(dir);
            } catch {
                throw new Error(
                    `Directory does not exist: ${dir}. Make sure Unraid API is properly installed.`
                );
            }

            // Create the modal test page
            await writeFile(this.modalPageFilePath, this.modalPageContent);

            // Inject welcome modal into login page
            await this.injectWelcomeModalIntoLoginPage();

            this.logger.info('✓ Modal test tool ENABLED');
            this.logger.info('\nAccess the tool at: Menu > UNRAID-OS > Dev Modal Test');
            this.logger.info('✓ Welcome modal injected into login page');
            this.logger.info('\nYou can now:');
            this.logger.info('  1. Navigate to /login to see the welcome modal');
            this.logger.info('  2. Use the Dev Modal Test page to control modals');
            this.logger.info('\nNote: You may need to refresh your browser to see changes.\n');
        } catch (error) {
            this.logger.error('Failed to enable modal test tool:', error);
            throw error;
        }
    }

    async disableModalTest(): Promise<void> {
        try {
            // Check if file exists
            const exists = await this.isModalTestEnabled();
            if (exists) {
                await unlink(this.modalPageFilePath);
                this.logger.info('✓ Modal test tool DISABLED');
                this.logger.info('The DevModalTest page has been removed from the Unraid menu.');
            } else {
                this.logger.info('Modal test tool is already disabled.');
            }

            // Remove welcome modal from login page
            await this.removeWelcomeModalFromLoginPage();
            this.logger.info('✓ Welcome modal removed from login page');
        } catch (error) {
            this.logger.error('Failed to disable modal test tool:', error);
            throw error;
        }
    }

    async isModalTestEnabled(): Promise<boolean> {
        try {
            await access(this.modalPageFilePath);
            return true;
        } catch {
            return false;
        }
    }

    async getModalTestStatus(): Promise<{ enabled: boolean }> {
        const enabled = await this.isModalTestEnabled();
        return {
            enabled,
        };
    }

    getModalTestingGuide(): string[] {
        return [
            'Modal Testing Guide',
            '==================',
            '',
            'When modal test mode is enabled:',
            '  - Welcome modal is injected into the login page (/login)',
            '  - Dev Modal Test page is available in the menu',
            '',
            'The Dev Modal Test page provides buttons to:',
            '  - Show/hide the Welcome Modal',
            '  - Show/hide the Activation Modal',
            '  - Clear all modal states (reset to default)',
            '  - Navigate to key pages (set-password, registration)',
            '',
            'Modal Behavior:',
            '  - Welcome Modal: Shows on /login (in test mode), /welcome page, and during set-password flow',
            '  - Activation Modal: Shows after password is set on fresh installs',
            '  - Use the buttons on the Dev Modal Test page to control modal visibility directly',
        ];
    }

    private async injectWelcomeModalIntoLoginPage(): Promise<void> {
        try {
            // Read the current login page content
            let loginContent = await readFile(this.loginPagePath, 'utf-8');

            // Check if welcome modal is already injected
            if (loginContent.includes(this.welcomeModalInclude)) {
                this.logger.info('Welcome modal already injected into login page');
                return;
            }

            // Find the closing body tag and inject the welcome modal before it
            const bodyEndTag = '</body>';
            if (loginContent.includes(bodyEndTag)) {
                loginContent = loginContent.replace(
                    bodyEndTag,
                    `${this.welcomeModalInclude}\n${bodyEndTag}`
                );

                // Write the modified content back
                await writeFile(this.loginPagePath, loginContent);
                this.logger.info('Welcome modal successfully injected into login page');
            } else {
                throw new Error('Could not find </body> tag in login page');
            }
        } catch (error) {
            this.logger.error('Failed to inject welcome modal into login page:', error);
            throw error;
        }
    }

    private async removeWelcomeModalFromLoginPage(): Promise<void> {
        try {
            // Read the current login page content
            let loginContent = await readFile(this.loginPagePath, 'utf-8');

            // Check if welcome modal is injected
            if (!loginContent.includes(this.welcomeModalInclude)) {
                this.logger.info('Welcome modal not found in login page');
                return;
            }

            // Remove the welcome modal include
            loginContent = loginContent.replace(`${this.welcomeModalInclude}\n`, '');
            loginContent = loginContent.replace(this.welcomeModalInclude, '');

            // Write the modified content back
            await writeFile(this.loginPagePath, loginContent);
            this.logger.info('Welcome modal successfully removed from login page');
        } catch (error) {
            this.logger.error('Failed to remove welcome modal from login page:', error);
            // Don't throw here as we want to continue with cleanup even if this fails
        }
    }
}
