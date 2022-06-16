import segfaultHandler from 'segfault-handler';
segfaultHandler.registerHandler('/var/log/unraid-api/crash.log');

import am from 'am';
import { main } from './cli/index';
import { internalLogger } from './core/log';

am(main, (error: unknown) => {
	internalLogger.fatal((error as Error).message);
});
