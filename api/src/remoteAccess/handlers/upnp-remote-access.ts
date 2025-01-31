import type { AccessUrl } from '@app/graphql/generated/api/types';
import { remoteAccessLogger } from '@app/core/log';
import { DynamicRemoteAccessType, URL_TYPE } from '@app/graphql/generated/api/types';
import { getServerIps } from '@app/graphql/resolvers/subscription/network';
import { type GenericRemoteAccess } from '@app/remoteAccess/handlers/remote-access-interface';
import { setWanAccessAndReloadNginx } from '@app/store/actions/set-wan-access-with-reload';
import { type AppDispatch, type RootState } from '@app/store/index';
import { disableUpnp, enableUpnp } from '@app/store/modules/upnp';

export class UpnpRemoteAccess implements GenericRemoteAccess {
    async stopRemoteAccess({ dispatch }: { getState: () => RootState; dispatch: AppDispatch }) {
        // Stop
        await dispatch(disableUpnp());
        await dispatch(setWanAccessAndReloadNginx('no'));
    }

    public getRemoteAccessUrl({ getState }: { getState: () => RootState }): AccessUrl | null {
        const urlsForServer = getServerIps(getState());
        const url = urlsForServer.urls.find((url) => url.type === URL_TYPE.WAN);

        return url ?? null;
    }

    async beginRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }) {
        // Stop Close Event
        const state = getState();
        const { dynamicRemoteAccessType } = state.config.remote;
        if (dynamicRemoteAccessType === DynamicRemoteAccessType.UPNP && !state.upnp.upnpEnabled) {
            const { portssl } = state.emhttp.var;
            try {
                const upnpEnableResult = await dispatch(enableUpnp({ portssl })).unwrap();
                await dispatch(setWanAccessAndReloadNginx('yes'));

                remoteAccessLogger.debug('UPNP Enable Result', upnpEnableResult);

                if (!upnpEnableResult.wanPortForUpnp) {
                    throw new Error('Failed to get a WAN Port from UPNP');
                }

                return this.getRemoteAccessUrl({ getState });
            } catch (error: unknown) {
                remoteAccessLogger.warn('Caught error, disabling UPNP and re-throwing');
                await this.stopRemoteAccess({ dispatch, getState });
                throw new Error(
                    `UPNP Dynamic Remote Access Error: ${
                        error instanceof Error ? error.message : 'Unknown Error'
                    }`
                );
            }
        }

        throw new Error('Invalid Parameters Passed to UPNP Remote Access Enabler');
    }
}
