import { Module } from '@nestjs/common';

import { DependencyService } from '@app/unraid-api/cli/plugins/dependency.service.js';
import {
    InstallPluginCommand,
    ListPluginCommand,
    PluginCommand,
    RemovePluginCommand,
} from '@app/unraid-api/cli/plugins/plugin.command.js';

const services = [DependencyService];
const commands = [PluginCommand, ListPluginCommand, InstallPluginCommand, RemovePluginCommand];
const moduleResources = [...services, ...commands];

@Module({
    providers: moduleResources,
    exports: moduleResources,
})
export class PluginCommandModule {}
