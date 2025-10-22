import { configureStore } from '@reduxjs/toolkit';

import { logger } from '@app/core/log.js';
import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { listenerMiddleware } from '@app/store/listeners/listener-middleware.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { rootReducer } from '@app/store/root-reducer.js';
import { FileLoadStatus } from '@app/store/types.js';

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

// loadDynamixConfig is located here and not in the actions/load-dynamix-config-file.js file because it needs to access the store,
// and injecting it seemed circular and convoluted for this use case.
/**
 * Loads the dynamix config into the store.
 * Can be called multiple times - uses TTL caching internally.
 * @returns The loaded dynamix config.
 */
export const loadDynamixConfig = () => {
    const configPaths = store.getState().paths['dynamix-config'] ?? [];
    try {
        const config = loadDynamixConfigFromDiskSync(configPaths);
        store.dispatch(
            updateDynamixConfig({
                ...config,
                status: FileLoadStatus.LOADED,
            })
        );
    } catch (error) {
        logger.error(error, 'Failed to load dynamix config from disk');
        store.dispatch(
            updateDynamixConfig({
                status: FileLoadStatus.FAILED_LOADING,
            })
        );
    }
    return store.getState().dynamix;
};

export const getters = {
    dynamix: () => loadDynamixConfig(),
    emhttp: () => store.getState().emhttp,
    paths: () => store.getState().paths,
    registration: () => store.getState().registration,
};
