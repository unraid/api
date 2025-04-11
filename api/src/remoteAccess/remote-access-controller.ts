import type { AppDispatch, RootState } from '@app/store/index.js';
import { remoteAccessLogger } from '@app/core/log.js';
import { UnraidLocalNotifier } from '@app/core/notifiers/unraid-local.js';
import { type IRemoteAccessController } from '@app/remoteAccess/handlers/remote-access-interface.js';
import { StaticRemoteAccess } from '@app/remoteAccess/handlers/static-remote-access.js';
import { UpnpRemoteAccess } from '@app/remoteAccess/handlers/upnp-remote-access.js';
import { getters } from '@app/store/index.js';
import {
    clearPing,
    receivedPing,
    setDynamicRemoteAccessError,
    setRemoteAccessRunningType,
} from '@app/store/modules/dynamic-remote-access.js';
import {
    AccessUrl,
    DynamicRemoteAccessType,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

export class RemoteAccessController implements IRemoteAccessController {
    static _instance: RemoteAccessController | null = null;
    activeRemoteAccess: UpnpRemoteAccess | StaticRemoteAccess | null = null;
    notifier: UnraidLocalNotifier = new UnraidLocalNotifier({ level: 'info' });

    constructor() {}

    public static get instance(): RemoteAccessController {
        if (!RemoteAccessController._instance) {
            RemoteAccessController._instance = new RemoteAccessController();
        }

        return RemoteAccessController._instance;
    }

    getRunningRemoteAccessType() {
        return getters.dynamicRemoteAccess().runningType;
    }

    public getRemoteAccessUrl({ getState }: { getState: () => RootState }): AccessUrl | null {
        if (!this.activeRemoteAccess) {
            return null;
        }
        return this.activeRemoteAccess.getRemoteAccessUrl({ getState });
    }

    async beginRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }) {
        const state = getState();
        const {
            config: {
                remote: { dynamicRemoteAccessType },
            },
            dynamicRemoteAccess: { runningType },
        } = state;

        if (!dynamicRemoteAccessType) {
            // Should never get here
            return null;
        }

        remoteAccessLogger.debug('Beginning remote access', runningType, dynamicRemoteAccessType);
        if (runningType !== dynamicRemoteAccessType) {
            await this.activeRemoteAccess?.stopRemoteAccess({
                getState,
                dispatch,
            });
        }

        switch (dynamicRemoteAccessType) {
            case DynamicRemoteAccessType.DISABLED:
                this.activeRemoteAccess = null;
                remoteAccessLogger.debug('Received begin event, but DRA is disabled.');
                break;
            case DynamicRemoteAccessType.UPNP:
                remoteAccessLogger.debug('UPNP DRA Begin');
                this.activeRemoteAccess = new UpnpRemoteAccess();
                break;
            case DynamicRemoteAccessType.STATIC:
                remoteAccessLogger.debug('Static DRA Begin');
                this.activeRemoteAccess = new StaticRemoteAccess();
                break;
            default:
                break;
        }

        // Essentially a super call to the active type
        try {
            await this.activeRemoteAccess?.beginRemoteAccess({
                getState,
                dispatch,
            });
            dispatch(setRemoteAccessRunningType(dynamicRemoteAccessType));
            this.extendRemoteAccess({ getState, dispatch });
            await this.notifier.send({
                title: 'Remote Access Started',
                data: { message: 'Remote access has been started' },
            });
        } catch (error: unknown) {
            dispatch(
                setDynamicRemoteAccessError(error instanceof Error ? error.message : 'Unknown Error')
            );
        }

        return null;
    }

    public extendRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }) {
        dispatch(receivedPing());
        return this.getRemoteAccessUrl({ getState });
    }

    async stopRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }) {
        remoteAccessLogger.debug('Stopping remote access');
        dispatch(clearPing());
        await this.activeRemoteAccess?.stopRemoteAccess({ getState, dispatch });

        dispatch(setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED));
        await this.notifier.send({
            title: 'Remote Access Stopped',
            data: { message: 'Remote access has been stopped' },
        });
    }
}
