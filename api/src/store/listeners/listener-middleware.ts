import 'reflect-metadata';

import type { TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';

import { type AppDispatch, type RootState } from '@app/store/index.js';
import { enableArrayEventListener } from '@app/store/listeners/array-event-listener.js';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

export const startMiddlewareListeners = () => {
    // Begin listening for events
    enableArrayEventListener();
};
