import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Timeout } from '@nestjs/schedule';
import { readFile } from 'node:fs/promises';

import { execa } from 'execa';

import type { ConfigType } from '../config/connect.config.js';
import { isConnectPluginInstalled } from './connect-plugin.utils.js';

/**
 * Service to handle syncing Connect's api plugin with the presence of the Connect Unraid plugin.
 */
@Injectable()
export class ConnectPluginService implements OnModuleDestroy {
    logger = new Logger(ConnectPluginService.name);

    constructor(private readonly configService: ConfigService<ConfigType>) {}

    /**
     * Prune the stale connect plugin entry, if necessary, when the module is de-initialized.
     */
    async onModuleDestroy() {
        if (isConnectPluginInstalled()) return;
        await this.pruneStaleConnectPluginEntry({ shouldRestart: false });
    }

    /**
     * Prune the stale connect plugin entry, if necessary, when the api starts.
     *
     * Due to the various startup tasks happening in parallel, doing this during the `onModuleInit` hook
     * does not work reliably, so a Timeout is used, because the pruning does not need to happen immediately.
     */
    @Timeout(1_000)
    async pruneOnStartupIfNecessary() {
        if (isConnectPluginInstalled()) return;
        await this.pruneStaleConnectPluginEntry({ shouldRestart: true });
    }

    /**
     * Prune the stale connect plugin entry, if necessary.
     *
     * Emits a warning and no-op's if invoked while the plugin is installed.
     * Otherwise, it will remove the stale plugin entry from the api and restart the api if desired.
     *
     * @param shouldRestart Whether to restart the api after pruning.
     */
    async pruneStaleConnectPluginEntry({ shouldRestart = true }: { shouldRestart?: boolean } = {}) {
        if (isConnectPluginInstalled()) {
            this.logger.warn(
                'Connect plugin is installed, skipping pruning. This should not have been invoked.'
            );
            return;
        }

        // First, correct the in-memory config, so we don't persist an incorrect config when this api instance shuts down.
        this.removeConnectPluginFromNestConfig();

        // Then, allow config subscription to flush to disk (25ms buffer + margin)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Finally, remove the stale plugin entry.
        await this.removeConnectPluginFromBootConfig(shouldRestart);
    }

    private get apiConfig() {
        return this.configService.get('api') || {};
    }

    private get apiPlugins() {
        return this.apiConfig.plugins || [];
    }

    private removeConnectPluginFromNestConfig() {
        const updatedPlugins = this.apiPlugins.filter((p: string) => p !== 'unraid-api-plugin-connect');
        this.configService.set('api', { ...this.apiConfig, plugins: updatedPlugins });
    }

    private async removeConnectPluginFromBootConfig(shouldRestart = true) {
        let removalCommand = 'unraid-api plugins remove -b unraid-api-plugin-connect';
        if (!shouldRestart) {
            removalCommand += ' --no-restart';
        }
        this.logger.warn(
            'Connect plugin is not installed, but is listed as an API plugin. Attempting `%s` automatically.',
            removalCommand
        );
        this.logger.debug('Plugins before running removal command: %o', this.apiPlugins);
        try {
            const { stdout, stderr } = await execa('unraid-api', removalCommand.split(' ').slice(1), {
                shell: 'bash',
                extendEnv: true,
            });

            if (stdout?.trim()) {
                this.logger.debug(stdout.trim());
            }

            if (stderr?.trim()) {
                this.logger.debug(stderr.trim());
            }

            this.logger.log(
                'Successfully completed `%s` to prune the stale connect plugin entry.',
                removalCommand
            );

            try {
                const flashApiConfig = JSON.parse(
                    await readFile(
                        '/boot/config/plugins/dynamix.my.servers/configs/api.json',
                        'utf-8'
                    ).catch(() => '{}')
                );
                this.logger.debug('Plugins after running removal command: %o', this.apiPlugins);
                this.logger.debug('Flash API config after running removal command: %o', flashApiConfig.plugins || []);
            } catch {
                this.logger.error('Failed to parse flash API config during debug! May be corrupt.');
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error while restarting API.';
            this.logger.error('Failed to restart API: %s', message);
        }
    }
}
