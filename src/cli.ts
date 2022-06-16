import segfaultHandler from 'segfault-handler';
import { main } from './cli/index';
import { internalLogger } from './core/log';
segfaultHandler.registerHandler('/var/log/unraid-api/crash.log');

main().catch((error: unknown) => {
	internalLogger.fatal((error as Error).message);
});
