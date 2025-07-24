import { Module } from '@nestjs/common';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';
import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { DeleteApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/delete-api-key.questions.js';
import { ConfigCommand } from '@app/unraid-api/cli/config.command.js';
import { DeveloperToolsService } from '@app/unraid-api/cli/developer/developer-tools.service.js';
import { DeveloperCommand } from '@app/unraid-api/cli/developer/developer.command.js';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { LogsCommand } from '@app/unraid-api/cli/logs.command.js';
import {
    InstallPluginCommand,
    ListPluginCommand,
    PluginCommand,
    RemovePluginCommand,
} from '@app/unraid-api/cli/plugins/plugin.command.js';
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
import { ApiConfigModule } from '@app/unraid-api/config/api-config.module.js';
import { LegacyConfigModule } from '@app/unraid-api/config/legacy-config.module.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { PluginCliModule } from '@app/unraid-api/plugin/plugin.module.js';

const DEFAULT_COMMANDS = [
    ApiKeyCommand,
    ConfigCommand,
    DeveloperCommand,
    LogsCommand,
    ReportCommand,
    VersionCommand,
    // Lifecycle commands
    SwitchEnvCommand,
    RestartCommand,
    StartCommand,
    StatusCommand,
    StopCommand,
    // SSO commands
    SSOCommand,
    ValidateTokenCommand,
    AddSSOUserCommand,
    RemoveSSOUserCommand,
    ListSSOUserCommand,
    // Plugin commands
    PluginCommand,
    ListPluginCommand,
    InstallPluginCommand,
    RemovePluginCommand,
] as const;

const DEFAULT_PROVIDERS = [
    AddApiKeyQuestionSet,
    DeleteApiKeyQuestionSet,
    AddSSOUserQuestionSet,
    RemoveSSOUserQuestionSet,
    DeveloperQuestions,
    DeveloperToolsService,
    LogService,
    PM2Service,
    ApiKeyService,
    SsoUserService,
    DependencyService,
    AdminKeyService,
    ApiReportService,
    CliInternalClientService,
] as const;

@Module({
    imports: [LegacyConfigModule, ApiConfigModule, GlobalDepsModule, PluginCliModule.register()],
    providers: [...DEFAULT_COMMANDS, ...DEFAULT_PROVIDERS],
    exports: [ApiReportService],
})
export class CliModule {}
