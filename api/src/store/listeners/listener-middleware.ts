import {
    addListener,
    createListenerMiddleware,
    type TypedAddListener,
    type TypedStartListening,
} from '@reduxjs/toolkit';
import { type AppDispatch, type RootState } from '@app/store';
import { enableUpnpListener } from '@app/store/listeners/upnp-listener';
import { enableAllowedOriginListener } from '@app/store/listeners/allowed-origin-listener';
import { enableConfigFileListener } from '@app/store/listeners/config-listener';
import { enableVersionListener } from '@app/store/listeners/version-listener';
import { enableMothershipJobsListener } from '@app/store/listeners/mothership-subscription-listener';
import { enableDynamicRemoteAccessListener } from '@app/store/listeners/dynamic-remote-access-listener';
import { enableArrayEventListener } from '@app/store/listeners/array-event-listener';
import { enableServerStateListener } from '@app/store/listeners/server-state-listener';
import { enableWanAccessChangeListener } from '@app/store/listeners/wan-access-change-listener';

import 'reflect-metadata';
import { enableNotificationPathListener } from '@app/store/listeners/notification-path-listener';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening =
    listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<
    RootState,
    AppDispatch
>;

export const startMiddlewareListeners = () => {
    // Begin listening for events
    enableConfigFileListener('flash')();
    enableConfigFileListener('memory')();
    enableUpnpListener();
    enableAllowedOriginListener();
    enableVersionListener();
    enableMothershipJobsListener();
    enableDynamicRemoteAccessListener();
    enableArrayEventListener();
    enableWanAccessChangeListener();
    enableServerStateListener();
    enableNotificationPathListener();
}
