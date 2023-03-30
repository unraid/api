import { logger } from '@app/core/log';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { pubsub } from '@app/core/pubsub';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loadSingleStateFile } from '@app/store/modules/emhttp';
import { StateFileKey } from '@app/store/types';
import { isAnyOf } from '@reduxjs/toolkit';

export const enableArrayEventListener = () =>
    startAppListening({
        matcher: isAnyOf(loadSingleStateFile.fulfilled),
        effect(action, { getState }) {
            if (
                loadSingleStateFile.fulfilled.match(action) &&
                action.meta.arg === StateFileKey.disks
            ) {
                const array = getArrayData(getState);
                logger.debug('Array was updated, publishing event %o', array);

                pubsub.publish('array', { event: { array } });
            }
        },
    });
