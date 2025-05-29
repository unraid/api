import { configureStore } from '@reduxjs/toolkit';

import { listenerMiddleware } from '@app/store/listeners/listener-middleware.js';
import { rootReducer } from '@app/store/root-reducer.js';

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).prepend(listenerMiddleware?.middleware ?? []),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type ApiStore = typeof store;

export const getters = {
    cache: () => store.getState().cache,
    config: () => store.getState().config,
    dynamix: () => store.getState().dynamix,
    emhttp: () => store.getState().emhttp,
    minigraph: () => store.getState().minigraph,
    paths: () => store.getState().paths,
    registration: () => store.getState().registration,
    upnp: () => store.getState().upnp,
};
