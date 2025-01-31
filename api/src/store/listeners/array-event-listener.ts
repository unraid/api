import { isAnyOf } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';

import { logger } from '@app/core/log';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loadSingleStateFile } from '@app/store/modules/emhttp';
import { StateFileKey } from '@app/store/types';

export const enableArrayEventListener = () =>
    startAppListening({
        matcher: isAnyOf(loadSingleStateFile.fulfilled),
        async effect(action, { getState, getOriginalState, delay, unsubscribe, subscribe }) {
            if (loadSingleStateFile.fulfilled.match(action)) {
                if (action.meta.arg === StateFileKey.disks) {
                    unsubscribe();
                    // getOriginalState must be called BEFORE the awaited delay in this function
                    const oldArrayData = getArrayData(getOriginalState);
                    await delay(5_000);
                    const array = getArrayData(getState);
                    if (!isEqual(oldArrayData, array)) {
                        pubsub.publish(PUBSUB_CHANNEL.ARRAY, { array });
                        logger.debug({ event: array }, 'Array was updated, publishing event');
                    }

                    subscribe();
                } else if (action.meta.arg === StateFileKey.var) {
                    if (!isEqual(getOriginalState().emhttp.var?.name, getState().emhttp.var?.name)) {
                        await pubsub.publish(PUBSUB_CHANNEL.INFO, {
                            info: {
                                os: {
                                    hostname: getState().emhttp.var?.name,
                                },
                            },
                        });
                    }
                }
            }
        },
    });
