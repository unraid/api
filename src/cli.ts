import { writeFile } from 'fs/promises';
import segfaultHandler from 'segfault-handler';
segfaultHandler.registerHandler('/var/log/unraid-api/crash.log', async (signal, address, stack) => {
	await writeFile('/var/log/unraid-api/crash.json', JSON.stringify({ signal, address, stack }));
});

import am from 'am';
import { main } from '@app/cli/index';
import { internalLogger } from '@app/core/log';

am(main, (error: unknown) => {
	internalLogger.fatal((error as Error).message);
});
