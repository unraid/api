import { addListener, createListenerMiddleware, type TypedAddListener, type TypedStartListening } from '@reduxjs/toolkit';
import { type AppDispatch, type RootState } from '@app/store';
import { enableUpnpListener } from '@app/store/listeners/upnp-listener';
import { enableConfigListener } from '@app/store/listeners/config-listener';
import { enableApiKeyListener } from './api-key-listener';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

// Begin listening for events
enableUpnpListener();
enableConfigListener();
enableApiKeyListener();
