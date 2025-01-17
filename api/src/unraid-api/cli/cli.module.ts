import { Module } from '@nestjs/common';

import { KeyCommand } from '@app/unraid-api/cli/key.command';
import { LogService } from '@app/unraid-api/cli/log.service';
import { ReportCommand } from '@app/unraid-api/cli/report.command';
import { RestartCommand } from '@app/unraid-api/cli/restart.command';
import { StartCommand } from '@app/unraid-api/cli/start.command';
import { StopCommand } from '@app/unraid-api/cli/stop.command';
import { SwitchEnvCommand } from '@app/unraid-api/cli/switch-env.command';
import { VersionCommand } from '@app/unraid-api/cli/version.command';
import { StatusCommand } from '@app/unraid-api/cli/status.command';
import { ValidateTokenCommand } from '@app/unraid-api/cli/validate-token.command';
import { LogsCommand } from '@app/unraid-api/cli/logs.command';

@Module({
    providers: [
        LogService,
        StartCommand,
        StopCommand,
        RestartCommand,
        ReportCommand,
        KeyCommand,
        SwitchEnvCommand,
        VersionCommand,
        StatusCommand,
        ValidateTokenCommand,
        LogsCommand
    ],
})
export class CliModule {}
