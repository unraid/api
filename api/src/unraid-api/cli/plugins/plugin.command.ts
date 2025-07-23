import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ADD_PLUGIN_MUTATION } from '@app/unraid-api/cli/mutations/add-plugin.mutation.js';
import { REMOVE_PLUGIN_MUTATION } from '@app/unraid-api/cli/mutations/remove-plugin.mutation.js';
import { PLUGINS_QUERY } from '@app/unraid-api/cli/queries/plugins.query.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

interface InstallPluginCommandOptions {
    bundled: boolean;
    restart: boolean;
}

@SubCommand({
    name: 'install',
    aliases: ['i', 'add'],
    description: 'Install a plugin as a peer dependency.',
    arguments: '<package>',
})
export class InstallPluginCommand extends CommandRunner {
    constructor(
        private readonly logService: LogService,
        private readonly restartCommand: RestartCommand,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }

    async run(passedParams: string[], options: InstallPluginCommandOptions): Promise<void> {
        if (passedParams.length === 0) {
            this.logService.error('Package name is required.');
            process.exitCode = 1;
            return;
        }

        try {
            const client = await this.internalClient.getClient();

            const result = await client.mutate({
                mutation: ADD_PLUGIN_MUTATION,
                variables: {
                    input: {
                        names: passedParams,
                        bundled: options.bundled,
                        restart: options.restart,
                    },
                },
            });

            const requiresManualRestart = result.data?.addPlugin;

            if (options.bundled) {
                this.logService.log(`Added bundled plugin ${passedParams.join(', ')}`);
            } else {
                this.logService.log(`Added plugin ${passedParams.join(', ')}`);
            }

            if (requiresManualRestart && options.restart) {
                await this.restartCommand.run();
            }
        } catch (error) {
            this.logService.error('Failed to add plugin:', error);
            process.exitCode = 1;
        }
    }

    @Option({
        flags: '-b, --bundled',
        description: 'Install as a bundled plugin (peer dependency version "workspace:*" and optional)',
        defaultValue: false,
    })
    parseBundled(): boolean {
        return true;
    }

    @Option({
        flags: '--no-restart',
        description: 'do NOT restart the service after deploy',
        defaultValue: true,
    })
    parseRestart(): boolean {
        return false;
    }
}

@SubCommand({
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove a plugin peer dependency.',
    arguments: '<package>',
})
export class RemovePluginCommand extends CommandRunner {
    constructor(
        private readonly logService: LogService,
        private readonly internalClient: CliInternalClientService,
        private readonly restartCommand: RestartCommand
    ) {
        super();
    }

    async run(passedParams: string[], options: InstallPluginCommandOptions): Promise<void> {
        if (passedParams.length === 0) {
            this.logService.error('Package name is required.');
            process.exitCode = 1;
            return;
        }

        try {
            const client = await this.internalClient.getClient();

            const result = await client.mutate({
                mutation: REMOVE_PLUGIN_MUTATION,
                variables: {
                    input: {
                        names: passedParams,
                        bundled: options.bundled,
                        restart: options.restart,
                    },
                },
            });

            const requiresManualRestart = result.data?.removePlugin;

            if (options.bundled) {
                this.logService.log(`Removed bundled plugin ${passedParams.join(', ')}`);
            } else {
                this.logService.log(`Removed plugin ${passedParams.join(', ')}`);
            }

            if (requiresManualRestart && options.restart) {
                await this.restartCommand.run();
            }
        } catch (error) {
            this.logService.error('Failed to remove plugin:', error);
            process.exitCode = 1;
        }
    }

    @Option({
        flags: '-b, --bundled',
        description: 'Uninstall a bundled plugin',
        defaultValue: false,
    })
    parseBundled(): boolean {
        return true;
    }

    @Option({
        flags: '--no-restart',
        description: 'do NOT restart the service after deploy',
        defaultValue: true,
    })
    parseRestart(): boolean {
        return false;
    }
}

@SubCommand({
    name: 'list',
    description: 'List installed plugins (peer dependencies)',
    options: { isDefault: true },
})
export class ListPluginCommand extends CommandRunner {
    constructor(
        private readonly logService: LogService,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }

    async run(): Promise<void> {
        try {
            const client = await this.internalClient.getClient();

            const result = await client.query({
                query: PLUGINS_QUERY,
            });

            const plugins = result.data?.plugins || [];

            if (plugins.length === 0) {
                this.logService.log('No plugins installed.');
                return;
            }

            this.logService.log('Installed plugins:\n');
            plugins.forEach((plugin) => {
                const moduleInfo: string[] = [];
                if (plugin.hasApiModule) moduleInfo.push('API');
                if (plugin.hasCliModule) moduleInfo.push('CLI');
                const modules = moduleInfo.length > 0 ? ` [${moduleInfo.join(', ')}]` : '';
                this.logService.log(`☑️ ${plugin.name}@${plugin.version}${modules}`);
            });
            this.logService.log(); // for spacing
        } catch (error) {
            this.logService.error('Failed to list plugins:', error);
            process.exitCode = 1;
        }
    }
}

@Injectable()
@Command({
    name: 'plugins',
    description: 'Manage Unraid API plugins (peer dependencies)',
    subCommands: [InstallPluginCommand, RemovePluginCommand, ListPluginCommand],
})
export class PluginCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.info('Please provide a subcommand or use --help for more information');
        process.exit(0);
    }
}
