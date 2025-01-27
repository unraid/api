#!/usr/bin/env node
import '@app/dotenv';

import { execSync } from 'child_process';

import { CommandFactory } from 'nest-commander';

import { cliLogger, internalLogger } from '@app/core/log';
import { CliModule } from '@app/unraid-api/cli/cli.module';

try {
    const shellToUse = execSync('which unraid-api').toString().trim();
    await CommandFactory.run(CliModule, {
        cliName: 'unraid-api',
        logger: false, // new LogService(), - enable this to see nest initialization issues
        completion: {
            fig: true,
            cmd: 'unraid-api',
            nativeShell: { executablePath: shellToUse },
        },
    });
    process.exit(0);
} catch (error) {
    cliLogger.error('ERROR:', error);
    internalLogger.error({
        message: 'Failed to start unraid-api',
        error,
    });
    process.exit(1);
}
