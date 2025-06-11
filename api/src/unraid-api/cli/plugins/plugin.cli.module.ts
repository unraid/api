import { Module } from '@nestjs/common';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { DependencyService } from '@app/unraid-api/cli/plugins/dependency.service.js';
import {
    InstallPluginCommand,
    ListPluginCommand,
    PluginCommand,
    RemovePluginCommand,
} from '@app/unraid-api/cli/plugins/plugin.command.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

const services = [DependencyService];
const commands = [
    PluginCommand,
    ListPluginCommand,
    InstallPluginCommand,
    RemovePluginCommand,
    RestartCommand,
];
export const moduleResources = [...services, ...commands];

@Module({
    providers: moduleResources,
    exports: moduleResources,
})
export class PluginCommandModule {}
