import 'reflect-metadata';

import type { TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';

import { type AppDispatch, type RootState } from '@app/store/index.js';
import { enableArrayEventListener } from '@app/store/listeners/array-event-listener.js';
import { enableConfigFileListener } from '@app/store/listeners/config-listener.js';
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
    enableConfigFileListener('flash')();
    enableConfigFileListener('memory')();
    enableUpnpListener();
    enableVersionListener();
    enableArrayEventListener();
    enableWanAccessChangeListener();
};
