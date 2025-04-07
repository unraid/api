import { combineReducers } from '@reduxjs/toolkit';

import { resetStore } from '@app/store/actions/reset-store.js';
import { cache } from '@app/store/modules/cache.js';
import { configReducer } from '@app/store/modules/config.js';
import { dynamicRemoteAccessReducer } from '@app/store/modules/dynamic-remote-access.js';
import { dynamix } from '@app/store/modules/dynamix.js';
import { emhttp } from '@app/store/modules/emhttp.js';
import { mothership } from '@app/store/modules/minigraph.js';
import { paths } from '@app/store/modules/paths.js';
import { registrationReducer } from '@app/store/modules/registration.js';
import { remoteGraphQLReducer } from '@app/store/modules/remote-graphql.js';
import { upnp } from '@app/store/modules/upnp.js';

/**
 * Root reducer that combines all slice reducers and handles the reset action.
 * When the reset action is dispatched, all slices will be reset to their initial state.
 */
const appReducer = combineReducers({
    config: configReducer,
    dynamicRemoteAccess: dynamicRemoteAccessReducer,
    minigraph: mothership.reducer,
    paths: paths.reducer,
    emhttp: emhttp.reducer,
    registration: registrationReducer,
    remoteGraphQL: remoteGraphQLReducer,
    cache: cache.reducer,
    upnp: upnp.reducer,
    dynamix: dynamix.reducer,
});

export const rootReducer = (state: any, action: any) => {
    // When the reset action is dispatched, return undefined to reset all reducers
    if (action.type === resetStore.type) {
        return appReducer(undefined, action);
    }

    // Otherwise, use the combined reducer
    return appReducer(state, action);
};
