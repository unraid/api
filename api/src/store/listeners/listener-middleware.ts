import 'reflect-metadata';

import type { TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';

import { type AppDispatch, type RootState } from '@app/store';
import { enableArrayEventListener } from '@app/store/listeners/array-event-listener';
import { enableConfigFileListener } from '@app/store/listeners/config-listener';
import { enableDynamicRemoteAccessListener } from '@app/store/listeners/dynamic-remote-access-listener';
import { enableMothershipJobsListener } from '@app/store/listeners/mothership-subscription-listener';
import { enableServerStateListener } from '@app/store/listeners/server-state-listener';
import { enableUpnpListener } from '@app/store/listeners/upnp-listener';
import { enableVersionListener } from '@app/store/listeners/version-listener';
import { enableWanAccessChangeListener } from '@app/store/listeners/wan-access-change-listener';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

export const startMiddlewareListeners = () => {
    // Begin listening for events
    enableMothershipJobsListener();
    enableConfigFileListener('flash')();
    enableConfigFileListener('memory')();
    enableUpnpListener();
    enableVersionListener();
    enableDynamicRemoteAccessListener();
    enableArrayEventListener();
    enableWanAccessChangeListener();
    enableServerStateListener();
};
