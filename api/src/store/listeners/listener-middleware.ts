import 'reflect-metadata';

import type { TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';

import { CONNECT } from '@app/environment.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';
import { enableArrayEventListener } from '@app/store/listeners/array-event-listener.js';
import { enableConfigFileListener } from '@app/store/listeners/config-listener.js';
import { enableDynamicRemoteAccessListener } from '@app/store/listeners/dynamic-remote-access-listener.js';
import { enableMothershipJobsListener } from '@app/store/listeners/mothership-subscription-listener.js';
import { enableServerStateListener } from '@app/store/listeners/server-state-listener.js';
import { enableUpnpListener } from '@app/store/listeners/upnp-listener.js';
import { enableVersionListener } from '@app/store/listeners/version-listener.js';
import { enableWanAccessChangeListener } from '@app/store/listeners/wan-access-change-listener.js';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

export const startMiddlewareListeners = () => {
    // Begin listening for events
    if (CONNECT) {
        enableMothershipJobsListener();
    }
    enableConfigFileListener('flash')();
    enableConfigFileListener('memory')();
    enableVersionListener();
    enableArrayEventListener();
    enableServerStateListener();
    if (CONNECT) {
        enableUpnpListener();
        enableDynamicRemoteAccessListener();
        enableWanAccessChangeListener();
    }
};
