import { DynamicModule, Module, Provider, Type } from '@nestjs/common';

import { CommandRunner } from 'nest-commander';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { ConfigCommand } from '@app/unraid-api/cli/config.command.js';
import { DeveloperCommand } from '@app/unraid-api/cli/developer/developer.command.js';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { LogsCommand } from '@app/unraid-api/cli/logs.command.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';
import { ReportCommand } from '@app/unraid-api/cli/report.command.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { AddSSOUserCommand } from '@app/unraid-api/cli/sso/add-sso-user.command.js';
import { AddSSOUserQuestionSet } from '@app/unraid-api/cli/sso/add-sso-user.questions.js';
import { ListSSOUserCommand } from '@app/unraid-api/cli/sso/list-sso-user.command.js';
import { RemoveSSOUserCommand } from '@app/unraid-api/cli/sso/remove-sso-user.command.js';
import { RemoveSSOUserQuestionSet } from '@app/unraid-api/cli/sso/remove-sso-user.questions.js';
import { SSOCommand } from '@app/unraid-api/cli/sso/sso.command.js';
import { ValidateTokenCommand } from '@app/unraid-api/cli/sso/validate-token.command.js';
import { StartCommand } from '@app/unraid-api/cli/start.command.js';
import { StatusCommand } from '@app/unraid-api/cli/status.command.js';
import { StopCommand } from '@app/unraid-api/cli/stop.command.js';
import { SwitchEnvCommand } from '@app/unraid-api/cli/switch-env.command.js';
import { VersionCommand } from '@app/unraid-api/cli/version.command.js';
import { UnraidAPIPlugin } from '@app/unraid-api/plugin/plugin.interface.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

const DEFAULT_COMMANDS = [
    ApiKeyCommand,
    ConfigCommand,
    DeveloperCommand,
    LogsCommand,
    ReportCommand,
    RestartCommand,
    StartCommand,
    StatusCommand,
    StopCommand,
    SwitchEnvCommand,
    VersionCommand,
    SSOCommand,
    ValidateTokenCommand,
    AddSSOUserCommand,
    RemoveSSOUserCommand,
    ListSSOUserCommand,
] as const;

const DEFAULT_PROVIDERS = [
    AddApiKeyQuestionSet,
    AddSSOUserQuestionSet,
    RemoveSSOUserQuestionSet,
    DeveloperQuestions,
    LogService,
    PM2Service,
    ApiKeyService,
] as const;

type PluginProvider = Provider & {
    provide: string | symbol | Type<any>;
    useValue?: UnraidAPIPlugin;
};

@Module({
    imports: [PluginModule],
    providers: [...DEFAULT_COMMANDS, ...DEFAULT_PROVIDERS],
})
export class CliModule {
    /**
     * Get all registered commands
     * @returns Array of registered command classes
     */
    static getCommands(): Type<CommandRunner>[] {
        return [...DEFAULT_COMMANDS];
    }

    /**
     * Register the module with plugin support
     * @returns DynamicModule configuration including plugin commands
     */
    static async registerWithPlugins(): Promise<DynamicModule> {
        const pluginModule = await PluginModule.registerPlugins();

        // Get commands from plugins
        const pluginCommands: Type<CommandRunner>[] = [];
        for (const provider of (pluginModule.providers || []) as PluginProvider[]) {
            if (provider.provide !== PluginService && provider.useValue?.commands) {
                pluginCommands.push(...provider.useValue.commands);
            }
        }

        return {
            module: CliModule,
            imports: [pluginModule],
            providers: [...DEFAULT_COMMANDS, ...DEFAULT_PROVIDERS, ...pluginCommands],
        };
    }
}
