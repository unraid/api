import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';

import { DependencyService } from '@app/unraid-api/cli/dependency.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

interface InstallPluginCommandOptions {
    bundled: boolean;
}

@SubCommand({
    name: 'install',
    aliases: ['i', 'add'],
    description: 'Install a plugin as a peer dependency.',
    arguments: '<package>',
})
export class InstallPluginCommand extends CommandRunner {
    constructor(
        private readonly dependencyService: DependencyService,
        private readonly logService: LogService,
        private readonly restartCommand: RestartCommand
    ) {
        super();
    }

    async run(passedParams: string[], options: InstallPluginCommandOptions): Promise<void> {
        const [packageName] = passedParams;
        if (!packageName) {
            this.logService.error('Package name is required.');
            process.exitCode = 1;
            return;
        }
        try {
            await this.dependencyService.addPeerDependency(packageName, options.bundled);
            this.logService.log(`Added ${packageName} as a peer dependency.`);
            if (!options.bundled) {
                await this.dependencyService.npmInstall();
                await this.dependencyService.rebuildVendorArchive();
            }
            await this.restartCommand.run();
        } catch (error) {
            this.logService.error(error);
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
}

@SubCommand({
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove a plugin peer dependency.',
    arguments: '<package>',
})
export class RemovePluginCommand extends CommandRunner {
    constructor(
        private readonly pluginService: DependencyService,
        private readonly logService: LogService,
        private readonly restartCommand: RestartCommand
    ) {
        super();
    }

    async run(passedParams: string[]): Promise<void> {
        const [packageName] = passedParams;
        if (!packageName) {
            this.logService.error('Package name is required.');
            process.exitCode = 1;
            return;
        }
        try {
            await this.pluginService.removePeerDependency(packageName);
            await this.restartCommand.run();
        } catch (error: unknown) {
            this.logService.error(`Failed to remove plugin: ${(error as Error).message}`);
            process.exitCode = 1;
        }
    }
}

@SubCommand({
    name: 'list',
    description: 'List installed plugins (peer dependencies)',
    options: { isDefault: true },
})
export class ListPluginCommand extends CommandRunner {
    constructor(private readonly logService: LogService) {
        super();
    }

    async run(): Promise<void> {
        const plugins = await PluginService.listPlugins();
        this.logService.log('Installed plugins:');
        plugins.forEach(([name, version]) => {
            this.logService.log(`☑️ ${name}@${version}`);
        });
    }
}

@Command({
    name: 'plugins',
    description: 'Manage Unraid API plugins (peer dependencies)',
    subCommands: [InstallPluginCommand, RemovePluginCommand, ListPluginCommand],
})
export class PluginCommand extends CommandRunner {
    constructor() {
        super();
    }
    async run(): Promise<void> {}
}
