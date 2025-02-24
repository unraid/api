import { isAnyOf } from '@reduxjs/toolkit';

import { upnpLogger } from '@app/core/log.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { type RootState } from '@app/store/index.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { loadSingleStateFile, loadStateFiles } from '@app/store/modules/emhttp.js';
import { disableUpnp, enableUpnp } from '@app/store/modules/upnp.js';
import { FileLoadStatus } from '@app/store/types.js';

const shouldUpnpBeEnabled = (state: RootState | null): boolean => {
    if (
        state?.config.status !== FileLoadStatus.LOADED ||
        state?.emhttp.status !== FileLoadStatus.LOADED
    ) {
        return false;
    }

    const { useUpnp } = state.emhttp.var;
    const { upnpEnabled, wanaccess } = state.config.remote;

    return useUpnp && upnpEnabled === 'yes' && wanaccess === 'yes';
};

const isStateOrConfigUpdate = isAnyOf(
    loadConfigFile.fulfilled,
    loadSingleStateFile.fulfilled,
    loadStateFiles.fulfilled,
    setupRemoteAccessThunk.fulfilled
);

export const enableUpnpListener = () =>
    startAppListening({
        predicate(action, currentState, previousState) {
            // @TODO: One of our actions is incorrectly configured. Sometimes the action is an anonymous function. We need to fix this.
            if (
                (isStateOrConfigUpdate(action) || !action?.type) &&
                shouldUpnpBeEnabled(currentState) !== shouldUpnpBeEnabled(previousState)
            ) {
                return true;
            }

            return false;
        },
        async effect(_, { getState, dispatch }) {
            const state = getState();
            const {
                config: {
                    remote: { wanport },
                },
                emhttp: {
                    var: { portssl },
                },
            } = getState();
            upnpLogger.info(
                'UPNP Enabled: (%s)  Wan Port: [%s]',
                shouldUpnpBeEnabled(state),
                wanport === '' ? 'Will Generate New WAN Port' : wanport
            );

            if (shouldUpnpBeEnabled(state)) {
                await dispatch(enableUpnp({ wanport, portssl }));
            } else {
                await dispatch(disableUpnp());
            }
        },
    });
