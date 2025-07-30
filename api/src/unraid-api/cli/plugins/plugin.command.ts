import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    NoPluginsFoundError,
    RemovePluginQuestionSet,
} from '@app/unraid-api/cli/plugins/remove-plugin.questions.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
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
        private readonly pluginManagementService: PluginManagementService
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
    restart: boolean;
}

@SubCommand({
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove plugin peer dependencies.',
})
export class RemovePluginCommand extends CommandRunner {
    constructor(
        private readonly logService: LogService,
        private readonly pluginManagementService: PluginManagementService,
        private readonly restartCommand: RestartCommand,
        private readonly inquirerService: InquirerService
    ) {
        super();
    }

    async run(_passedParams: string[], options?: RemovePluginCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(RemovePluginQuestionSet.name, options);
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

        if (!options.plugins || options.plugins.length === 0) {
            this.logService.warn('No plugins selected for removal.');
            return;
        }

        await this.pluginManagementService.removePlugin(...options.plugins);
        for (const plugin of options.plugins) {
            this.logService.log(`Removed plugin ${plugin}`);
        }

        if (options.restart) {
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
