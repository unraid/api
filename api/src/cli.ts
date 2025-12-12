import '@app/dotenv.js';

import { Logger } from '@nestjs/common';
import { appendFileSync } from 'node:fs';

import { CommandFactory } from 'nest-commander';

import { LOG_LEVEL, SUPPRESS_LOGS } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

const BOOT_LOG_PATH = '/var/log/unraid-api/boot.log';

const logToBootFile = (message: string): void => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [cli] ${message}\n`;
    try {
        appendFileSync(BOOT_LOG_PATH, line);
    } catch {
        // Silently fail if we can't write to boot log
    }
};

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
    logToBootFile(`CLI started with args: ${process.argv.slice(2).join(' ')}`);

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
    logToBootFile('CLI completed successfully');
    process.exit(0);
} catch (error) {
    // Always log errors to boot file for boot-time debugging
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    logToBootFile(`CLI ERROR: ${errorMessage}`);

    if (logger) {
        logger.error('ERROR:', error);
    } else {
        console.error('ERROR:', error);
    }
    process.exit(1);
}
