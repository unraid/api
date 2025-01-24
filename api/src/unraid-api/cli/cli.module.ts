import { Module } from '@nestjs/common';

import { ConfigCommand } from '@app/unraid-api/cli/config.command';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command';
import { LogService } from '@app/unraid-api/cli/log.service';
import { LogsCommand } from '@app/unraid-api/cli/logs.command';
import { ReportCommand } from '@app/unraid-api/cli/report.command';
import { RestartCommand } from '@app/unraid-api/cli/restart.command';
import { AddSSOUserCommand } from '@app/unraid-api/cli/sso/add-sso-user.command';
import { AddSSOUserQuestionSet } from '@app/unraid-api/cli/sso/add-sso-user.questions';
import { SSOCommand } from '@app/unraid-api/cli/sso/sso.command';
import { ValidateTokenCommand } from '@app/unraid-api/cli/sso/validate-token.command';
import { StartCommand } from '@app/unraid-api/cli/start.command';
import { StatusCommand } from '@app/unraid-api/cli/status.command';
import { StopCommand } from '@app/unraid-api/cli/stop.command';
import { SwitchEnvCommand } from '@app/unraid-api/cli/switch-env.command';
import { VersionCommand } from '@app/unraid-api/cli/version.command';
import { RemoveSSOUserCommand } from '@app/unraid-api/cli/sso/remove-sso-user.command';
import { RemoveSSOUserQuestionSet } from '@app/unraid-api/cli/sso/remove-sso-user.questions';
import { ListSSOUserCommand } from '@app/unraid-api/cli/sso/list-sso-user.command';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

@Module({
    providers: [
        AddSSOUserCommand,
        AddSSOUserQuestionSet,
        RemoveSSOUserCommand,
        RemoveSSOUserQuestionSet,
        ListSSOUserCommand,
        LogService,
        StartCommand,
        StopCommand,
        RestartCommand,
        ReportCommand,
        ApiKeyService,
        ApiKeyCommand,
        AddApiKeyQuestionSet,
        SwitchEnvCommand,
        VersionCommand,
        StatusCommand,
        SSOCommand,
        ValidateTokenCommand,
        LogsCommand,
        ConfigCommand,
    ],
})
export class CliModule {}
