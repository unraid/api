import { remoteAccessLogger } from '@app/core/log';
import { UnraidLocalNotifier } from '@app/core/notifiers/unraid-local';
import { AccessUrl, DynamicRemoteAccessType } from '@app/graphql/generated/api/types';
import { type IRemoteAccessController } from '@app/remoteAccess/handlers/remote-access-interface';
import { StaticRemoteAccess } from '@app/remoteAccess/handlers/static-remote-access';
import { UpnpRemoteAccess } from '@app/remoteAccess/handlers/upnp-remote-access';
import { getters, type AppDispatch, type RootState } from '@app/store/index';
import {
    clearPing,
    receivedPing,
    setDynamicRemoteAccessError,
    setRemoteAccessRunningType,
} from '@app/store/modules/dynamic-remote-access';
export class RemoteAccessController implements IRemoteAccessController {
    static _instance: RemoteAccessController | null = null;
    activeRemoteAccess: UpnpRemoteAccess | StaticRemoteAccess | null = null;
    notifier: UnraidLocalNotifier = new UnraidLocalNotifier({ level: 'info' });

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
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

    public getRemoteAccessUrl({
        getState,
    }: {
        getState: () => RootState;
    }): AccessUrl | null {
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
                remote: { dynamicRemoteAccessType, apikey },
            },
            dynamicRemoteAccess: { runningType },
        } = state;

        if (!dynamicRemoteAccessType) {
            // Should never get here
            return null;
        }

        remoteAccessLogger.debug(
            'Beginning remote access',
            runningType,
            dynamicRemoteAccessType
        );
        if (runningType !== dynamicRemoteAccessType) {
            await this.activeRemoteAccess?.stopRemoteAccess({
                getState,
                dispatch,
            });
        }

        switch (dynamicRemoteAccessType) {
            case DynamicRemoteAccessType.DISABLED:
                this.activeRemoteAccess = null;
                remoteAccessLogger.debug(
                    'Received begin event, but DRA is disabled.'
                );
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
                setDynamicRemoteAccessError(
                    error instanceof Error ? error.message : 'Unknown Error'
                )
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
