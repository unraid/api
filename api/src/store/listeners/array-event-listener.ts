import { logger } from '@app/core/log';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { pubsub } from '@app/core/pubsub';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loadSingleStateFile } from '@app/store/modules/emhttp';
import { StateFileKey } from '@app/store/types';
import { isAnyOf } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';

export const enableArrayEventListener = () =>
    startAppListening({
        matcher: isAnyOf(loadSingleStateFile.fulfilled),
        effect(action, { getState, getOriginalState }) {
            if (
                loadSingleStateFile.fulfilled.match(action) &&
                action.meta.arg === StateFileKey.disks
            ) {
                const oldArrayData = getArrayData(getOriginalState);
                const array = getArrayData(getState);
                if (isEqual(oldArrayData, array)) {
                    // Field updated that didn't require a publish
                    return;
                }
                logger.addContext('event', array);
                logger.debug('Array was updated, publishing event');
                logger.removeContext('event');

                pubsub.publish('array', { array });
            }
        },
    });
