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
    dynamix: () => store.getState().dynamix,
    emhttp: () => store.getState().emhttp,
    paths: () => store.getState().paths,
    registration: () => store.getState().registration,
};
