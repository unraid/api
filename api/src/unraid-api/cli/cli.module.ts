import { Module } from '@nestjs/common';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { DeleteApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/delete-api-key.questions.js';
import { ConfigCommand } from '@app/unraid-api/cli/config.command.js';
import { DeveloperCommand } from '@app/unraid-api/cli/developer/developer.command.js';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { LogsCommand } from '@app/unraid-api/cli/logs.command.js';
import { PluginCommandModule } from '@app/unraid-api/cli/plugins/plugin.cli.module.js';
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
import { PluginCliModule } from '@app/unraid-api/plugin/plugin.module.js';

// cli - plugin add/remove
// plugin generator

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
    DeleteApiKeyQuestionSet,
    AddSSOUserQuestionSet,
    RemoveSSOUserQuestionSet,
    DeveloperQuestions,
    LogService,
    PM2Service,
    ApiKeyService,
    SsoUserService,
] as const;

@Module({
    imports: [LegacyConfigModule, ApiConfigModule, PluginCliModule.register(), PluginCommandModule],
    providers: [...DEFAULT_COMMANDS, ...DEFAULT_PROVIDERS],
})
export class CliModule {}
