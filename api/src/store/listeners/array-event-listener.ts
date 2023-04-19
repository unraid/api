import { logger } from '@app/core/log';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { pubsub } from '@app/core/pubsub';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loadSingleStateFile } from '@app/store/modules/emhttp';
import { StateFileKey } from '@app/store/types';
import { isAnyOf } from '@reduxjs/toolkit';
import { getDiff } from 'json-difference';
import { isEqual } from 'lodash';

export const enableArrayEventListener = () =>
    startAppListening({
        matcher: isAnyOf(loadSingleStateFile.fulfilled),
        async effect(
            action,
            { getState, getOriginalState, delay, unsubscribe, subscribe }
        ) {
            if (
                loadSingleStateFile.fulfilled.match(action) &&
                action.meta.arg === StateFileKey.disks
            ) {
                unsubscribe();
                // getOriginalState must be called BEFORE the awaited delay in this function
                const oldArrayData = getArrayData(getOriginalState);
                await delay(5_000);
                const array = getArrayData(getState);
                if (!isEqual(oldArrayData, array) && getDiff(array,oldArrayData)) {
                    pubsub.publish('array', { array });
                    logger.addContext('event', array);
                    logger.debug('Array was updated, publishing event');
                    logger.removeContext('event');
                }

                subscribe();
            }
        },
    });
