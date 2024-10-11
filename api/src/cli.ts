import 'wtfnode';

import { am } from '@app/am';

import { main } from '@app/cli/index';
import { internalLogger } from '@app/core/log';

void am(main, (error: unknown) => {
	internalLogger.fatal((error as Error).message);
	// Ensure process is exited
	process.exit(1);
});
