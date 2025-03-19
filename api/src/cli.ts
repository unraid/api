import '@app/dotenv.js';

import { execa } from 'execa';
import { CommandFactory } from 'nest-commander';

import { internalLogger, logger } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';
import { CliModule } from '@app/unraid-api/cli/cli.module.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

const getUnraidApiLocation = async () => {
    try {
        const shellToUse = await execa('which unraid-api');
        return shellToUse.stdout.trim();
    } catch (err) {
        logger.debug('Could not find unraid-api in PATH, using default location');

        return '/usr/bin/unraid-api';
    }
};

try {
    // Register plugins and create a dynamic module configuration
    const dynamicModule = await CliModule.registerWithPlugins();
    
    // Create a new class that extends CliModule with the dynamic configuration
    const DynamicCliModule = class extends CliModule {
        static module = dynamicModule.module;
        static imports = dynamicModule.imports;
        static providers = dynamicModule.providers;
    };
    await CommandFactory.run(DynamicCliModule, {
        cliName: 'unraid-api',
        logger: LOG_LEVEL === 'TRACE' ? new LogService() : false, // - enable this to see nest initialization issues
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
