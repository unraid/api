import { internalLogger } from '@app/core/index';
import {startApp} from '@app/index';

export const boot = async () => {
    internalLogger.info('Booting Unraid API');
    await startApp();
}