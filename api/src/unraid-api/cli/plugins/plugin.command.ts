import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    NoPluginsFoundError,
    RemovePluginQuestionSet,
} from '@app/unraid-api/cli/plugins/remove-plugin.questions.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { ApiConfigPersistence } from '@app/unraid-api/config/api-config.module.js';
import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';
import { parsePackageArg } from '@app/utils.js';

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
        private readonly pluginManagementService: PluginManagementService,
        private readonly apiConfigPersistence: ApiConfigPersistence
    ) {
        super();
    }

    async run(passedParams: string[], options: InstallPluginCommandOptions): Promise<void> {
        if (passedParams.length === 0) {
            this.logService.error('Package name is required.');
            process.exitCode = 1;
            return;
        }
        if (options.bundled) {
            await this.pluginManagementService.addBundledPlugin(...passedParams);
            this.logService.log(`Added bundled plugin ${passedParams.join(', ')}`);
        } else {
            await this.pluginManagementService.addPlugin(...passedParams);
            this.logService.log(`Added plugin ${passedParams.join(', ')}`);
        }
        await this.apiConfigPersistence.persist();
        if (options.restart) {
            await this.restartCommand.run();
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

interface RemovePluginCommandOptions {
    plugins?: string[];
    restart?: boolean;
    bypassNpm?: boolean;
}

@SubCommand({
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove plugin peer dependencies.',
    arguments: '[plugins...]',
})
export class RemovePluginCommand extends CommandRunner {
    constructor(
        private readonly logService: LogService,
        private readonly pluginManagementService: PluginManagementService,
        private readonly restartCommand: RestartCommand,
        private readonly inquirerService: InquirerService,
        private readonly apiConfigPersistence: ApiConfigPersistence
    ) {
        super();
    }

    async run(passedParams: string[], options?: RemovePluginCommandOptions): Promise<void> {
        const cliBypass = options?.bypassNpm;
        const cliRestart = options?.restart;
        const mergedOptions: RemovePluginCommandOptions = {
            bypassNpm: cliBypass ?? false,
            restart: cliRestart ?? true,
            plugins: passedParams.length > 0 ? passedParams : options?.plugins,
        };

        let resolvedOptions = mergedOptions;
        if (!mergedOptions.plugins?.length) {
            const promptOptions = await this.promptForPlugins(mergedOptions);
            if (!promptOptions) {
                return;
            }
            resolvedOptions = {
                // precedence: cli > prompt > default (fallback)
                bypassNpm: cliBypass ?? promptOptions.bypassNpm ?? mergedOptions.bypassNpm,
                restart: cliRestart ?? promptOptions.restart ?? mergedOptions.restart,
                // precedence: prompt > default (fallback)
                plugins: promptOptions.plugins ?? mergedOptions.plugins,
            };
        }

        if (!resolvedOptions.plugins?.length) {
            this.logService.warn('No plugins selected for removal.');
            return;
        }

        if (resolvedOptions.bypassNpm) {
            await this.pluginManagementService.removePluginConfigOnly(...resolvedOptions.plugins);
        } else {
            await this.pluginManagementService.removePlugin(...resolvedOptions.plugins);
        }
        for (const plugin of resolvedOptions.plugins) {
            this.logService.log(`Removed plugin ${plugin}`);
        }
        await this.apiConfigPersistence.persist();

        if (resolvedOptions.restart) {
            await this.restartCommand.run();
        }
    }

    @Option({
        flags: '--no-restart',
        description: 'do NOT restart the service after deploy',
        defaultValue: true,
    })
    parseRestart(): boolean {
        return false;
    }

    @Option({
        flags: '-b, --bypass-npm',
        description: 'Bypass npm uninstall and only update the config',
        defaultValue: false,
        name: 'bypassNpm',
    })
    parseBypass(): boolean {
        return true;
    }

    @Option({
        flags: '--npm',
        description: 'Run npm uninstall for unbundled plugins (default behavior)',
        name: 'bypassNpm',
    })
    parseRunNpm(): boolean {
        return false;
    }

    private async promptForPlugins(
        initialOptions: RemovePluginCommandOptions
    ): Promise<RemovePluginCommandOptions | undefined> {
        try {
            return await this.inquirerService.prompt(RemovePluginQuestionSet.name, initialOptions);
        } catch (error) {
            if (error instanceof NoPluginsFoundError) {
                this.logService.error(error.message);
                process.exit(0);
            } else if (error instanceof Error) {
                this.logService.error('Failed to fetch plugins: %s', error.message);
                process.exit(1);
            } else {
                this.logService.error('An unexpected error occurred');
                process.exit(1);
            }
        }
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
        private readonly pluginManagementService: PluginManagementService
    ) {
        super();
    }

    async run(): Promise<void> {
        const configPlugins = this.pluginManagementService.plugins;
        const installedPlugins = await PluginService.listPlugins();

        // this can happen if configPlugins is a super set of installedPlugins
        if (installedPlugins.length !== configPlugins.length) {
            const configSet = new Set(configPlugins.map((plugin) => parsePackageArg(plugin).name));
            const installedSet = new Set(installedPlugins.map(([name]) => name));
            const notInstalled = Array.from(configSet.difference(installedSet));
            this.logService.warn(`${notInstalled.length} plugins are not installed:`);
            this.logService.table('warn', notInstalled);
        }

        if (installedPlugins.length === 0) {
            this.logService.log('No plugins installed.');
            return;
        }

        this.logService.log('Installed plugins:\n');
        installedPlugins.forEach(([name, version]) => {
            this.logService.log(`☑️ ${name}@${version}`);
        });
        this.logService.log(); // for spacing
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
