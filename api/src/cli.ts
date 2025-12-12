import '@app/dotenv.js';

import { Logger } from '@nestjs/common';

import { CommandFactory } from 'nest-commander';

import { LOG_LEVEL, SUPPRESS_LOGS } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

const getUnraidApiLocation = async () => {
    const { execa } = await import('execa');
    try {
        const shellToUse = await execa('which unraid-api');
        return shellToUse.stdout.trim();
    } catch (err) {
        return '/usr/bin/unraid-api';
    }
};

const getLogger = () => {
    if (LOG_LEVEL === 'TRACE' && !SUPPRESS_LOGS) {
        return new LogService();
    }
    return false;
};

const logger = getLogger();
try {
    await import('json-bigint-patch');
    const { CliModule } = await import('@app/unraid-api/cli/cli.module.js');

    await CommandFactory.run(CliModule, {
        cliName: 'unraid-api',
        logger: logger, // - enable this to see nest initialization issues
        completion: {
            fig: false,
            cmd: 'completion-script',
            nativeShell: { executablePath: await getUnraidApiLocation() },
        },
    });
    process.exit(0);
} catch (error) {
    if (logger) {
        logger.error('ERROR:', error);
    }
    process.exit(1);
}
