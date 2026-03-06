import { Inject, Injectable } from '@nestjs/common';
import { access, unlink, writeFile } from 'fs/promises';
import * as path from 'path';

import type { CanonicalInternalClientService } from '@unraid/shared';
import { CANONICAL_INTERNAL_CLIENT_TOKEN } from '@unraid/shared';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { UPDATE_SANDBOX_MUTATION } from '@app/unraid-api/cli/queries/developer.mutation.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

@Injectable()
export class DeveloperToolsService {
    private readonly modalPageFilePath =
        '/usr/local/emhttp/plugins/dynamix.my.servers/DevModalTest.page';
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
$wcExtractor = WebComponentsExtractor::getInstance();
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
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClient: CanonicalInternalClientService
    ) {}

    async setSandboxMode(enable: boolean): Promise<void> {
        try {
            const client = await this.internalClient.getClient({ enableSubscriptions: false });

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

            this.logger.info('✓ Modal test tool ENABLED');
            this.logger.info('\nAccess the tool at: Menu > UNRAID-OS > Dev Modal Test');
            this.logger.info('\nYou can now:');
            this.logger.info('  1. Use the Dev Modal Test page to control modals');
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
            '  - Dev Modal Test page is available in the menu',
            '',
            'The Dev Modal Test page provides buttons to:',
            '  - Show/hide the Activation Modal',
            '  - Clear all modal states (reset to default)',
            '  - Navigate to key pages (set-password, registration)',
            '',
            'Modal Behavior:',
            '  - Activation Modal: Shows after password is set on fresh installs',
            '  - Use the buttons on the Dev Modal Test page to control modal visibility directly',
        ];
    }
}
