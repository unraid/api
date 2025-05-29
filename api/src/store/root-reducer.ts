import { combineReducers, UnknownAction } from '@reduxjs/toolkit';

import { resetStore } from '@app/store/actions/reset-store.js';
import { cache } from '@app/store/modules/cache.js';
import { configReducer } from '@app/store/modules/config.js';
import { dynamix } from '@app/store/modules/dynamix.js';
import { emhttp } from '@app/store/modules/emhttp.js';
import { mothershipReducer } from '@app/store/modules/minigraph.js';
import { paths } from '@app/store/modules/paths.js';
import { registrationReducer } from '@app/store/modules/registration.js';
import { upnp } from '@app/store/modules/upnp.js';

/**
 * Root reducer that combines all slice reducers and handles the reset action.
 * When the reset action is dispatched, all slices will be reset to their initial state.
 */
const appReducer = combineReducers({
    config: configReducer,
    minigraph: mothershipReducer,
    paths: paths.reducer,
    emhttp: emhttp.reducer,
    registration: registrationReducer,
    cache: cache.reducer,
    upnp: upnp.reducer,
    dynamix: dynamix.reducer,
});

// Define the return type of the combined reducer
type AppState = ReturnType<typeof appReducer>;

export const rootReducer = (state: AppState | undefined, action: UnknownAction): AppState => {
    // When the reset action is dispatched, return undefined to reset all reducers
    if (action.type === resetStore.type) {
        return appReducer(undefined, action);
    }

    // Otherwise, use the combined reducer
    return appReducer(state, action);
};
