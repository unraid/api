import { Module } from '@nestjs/common';

import { InquirerService } from 'nest-commander';

import { ConfigCommand } from '@app/unraid-api/cli/config.command';
import { KeyCommand } from '@app/unraid-api/cli/key.command';
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

@Module({
    providers: [
        AddSSOUserCommand,
        AddSSOUserQuestionSet,
        LogService,
        StartCommand,
        StopCommand,
        RestartCommand,
        ReportCommand,
        KeyCommand,
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
