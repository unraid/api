import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch, RootState } from '@app/store/types.js';
import { listenerMiddleware } from '@app/store/listeners/listener-middleware.js';
import { docker } from '@app/store/modules/docker.js';
import { dynamix } from '@app/store/modules/dynamix.js';
import { emhttp } from '@app/store/modules/emhttp.js';
import { paths } from '@app/store/modules/paths.js';
import { registration } from '@app/store/modules/registration.js';

export const store = configureStore({
    reducer: {
        docker: docker.reducer,
        dynamix: dynamix.reducer,
        emhttp: emhttp.reducer,
        paths: paths.reducer,
        registration: registration.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).prepend(listenerMiddleware.middleware),
});

export type { AppDispatch, RootState };

export const getters = {
    docker: () => store.getState().docker,
    dynamix: () => store.getState().dynamix,
    emhttp: () => store.getState().emhttp,
    paths: () => store.getState().paths,
    registration: () => store.getState().registration,
} as const;
