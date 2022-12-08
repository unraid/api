import { addListener, createListenerMiddleware, type TypedAddListener, type TypedStartListening } from '@reduxjs/toolkit';
import { type AppDispatch, type RootState } from '@app/store';
import { upnpListener } from './upnpListener';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening
  = listenerMiddleware.startListening as AppStartListening;

export type AppStartListeningParams = Parameters<typeof startAppListening>[0];

export const addAppListener = addListener as TypedAddListener<
RootState,
AppDispatch
>;

startAppListening(upnpListener);
