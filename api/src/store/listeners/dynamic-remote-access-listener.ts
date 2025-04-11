import { isAnyOf } from '@reduxjs/toolkit';

import { remoteAccessLogger } from '@app/core/log.js';
import { RemoteAccessController } from '@app/remoteAccess/remote-access-controller.js';
import { type RootState } from '@app/store/index.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { FileLoadStatus } from '@app/store/types.js';
import { DynamicRemoteAccessType } from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

const shouldDynamicRemoteAccessBeEnabled = (state: RootState | null): boolean => {
    if (
        state?.config.status !== FileLoadStatus.LOADED ||
        state?.emhttp.status !== FileLoadStatus.LOADED
    ) {
        return false;
    }

    if (
        state.config.remote.dynamicRemoteAccessType &&
        state.config.remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED
    ) {
        return true;
    }

    return false;
};

const isStateOrConfigUpdate = isAnyOf(loadConfigFile.fulfilled);

export const enableDynamicRemoteAccessListener = () =>
    startAppListening({
        predicate(action, currentState, previousState) {
            if (
                (isStateOrConfigUpdate(action) || !action?.type) &&
                shouldDynamicRemoteAccessBeEnabled(currentState) !==
                    shouldDynamicRemoteAccessBeEnabled(previousState)
            ) {
                return true;
            }

            return false;
        },
        async effect(_, { getState, dispatch }) {
            const state = getState();
            const remoteAccessType = state.config.remote?.dynamicRemoteAccessType;
            if (!remoteAccessType) {
                return;
            }

            if (remoteAccessType === DynamicRemoteAccessType.DISABLED) {
                remoteAccessLogger.info('[Listener] Disabling Dynamic Remote Access Feature');
                await RemoteAccessController.instance.stopRemoteAccess({ getState, dispatch });
            }
        },
    });
