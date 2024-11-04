#!/usr/bin/env node

import { main } from '@app/cli/index';
import { internalLogger } from '@app/core/log';

try {
    await main();
} catch (error) {
    console.log(error);
    internalLogger.error({
        message: 'Failed to start unraid-api',
        error,
    });
    process.exit(1);
}
