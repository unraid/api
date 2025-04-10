import { remoteAccessLogger } from '@app/core/log.js';
import { getServerIps } from '@app/graphql/resolvers/subscription/network.js';
import { type GenericRemoteAccess } from '@app/remoteAccess/handlers/remote-access-interface.js';
import { setWanAccessAndReloadNginx } from '@app/store/actions/set-wan-access-with-reload.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';
import {
    AccessUrl,
    DynamicRemoteAccessType,
    URL_TYPE,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

export class StaticRemoteAccess implements GenericRemoteAccess {
    public getRemoteAccessUrl({ getState }: { getState: () => RootState }): AccessUrl | null {
        const url = getServerIps(getState()).urls.find((url) => url.type === URL_TYPE.WAN);
        return url ?? null;
    }

    async beginRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }): Promise<AccessUrl | null> {
        const {
            config: {
                remote: { dynamicRemoteAccessType },
            },
        } = getState();
        if (dynamicRemoteAccessType === DynamicRemoteAccessType.STATIC) {
            remoteAccessLogger.debug('Enabling remote access for Static Client');
            await dispatch(setWanAccessAndReloadNginx('yes'));
            return this.getRemoteAccessUrl({ getState });
        }

        throw new Error('Invalid Parameters Passed to Static Remote Access Enabler');
    }

    async stopRemoteAccess({
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }): Promise<void> {
        await dispatch(setWanAccessAndReloadNginx('no'));
    }
}
