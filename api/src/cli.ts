#!/usr/bin/env node

import '@app/dotenv';

import { execa } from 'execa';
import { CommandFactory } from 'nest-commander';

import { internalLogger, logger } from '@app/core/log';
import { LOG_LEVEL } from '@app/environment';
import { CliModule } from '@app/unraid-api/cli/cli.module';
import { LogService } from '@app/unraid-api/cli/log.service';

const getUnraidApiLocation = async () => {
    try {
        const shellToUse = await execa('which unraid-api');
        if (shellToUse.code !== 0) {
            throw new Error('unraid-api not found');
        }
        return shellToUse.stdout.trim();
    } finally {
        return '/usr/bin/unraid-api';
    }
};

try {
    await CommandFactory.run(CliModule, {
        cliName: 'unraid-api',
        logger: LOG_LEVEL === 'TRACE' && new LogService(), // - enable this to see nest initialization issues
        completion: {
            fig: false,
            cmd: 'completion-script',
            nativeShell: { executablePath: await getUnraidApiLocation() },
        },
    });
    process.exit(0);
} catch (error) {
    logger.error('ERROR:', error);
    internalLogger.error({
        message: 'Failed to start unraid-api',
        error,
    });
    process.exit(1);
}
