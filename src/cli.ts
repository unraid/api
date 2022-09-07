import 'wtfnode';
import { writeFileSync } from 'fs';
import segfaultHandler from 'segfault-handler';
segfaultHandler.registerHandler('/var/log/unraid-api/crash.log', (signal, address, stack) => {
	writeFileSync('/var/log/unraid-api/crash.json', JSON.stringify({ signal, address, stack }));
});

import { am } from 'am';
import { main } from '@app/cli/index';
import { internalLogger } from '@app/core/log';

void am(main, (error: unknown) => {
	internalLogger.fatal((error as Error).message);
	// Ensure process is exited
	process.exit(1);
});
