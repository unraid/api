import { configureStore } from '@reduxjs/toolkit';

import { listenerMiddleware } from '@app/store/listeners/listener-middleware.js';
import { cache } from '@app/store/modules/cache.js';
import { configReducer } from '@app/store/modules/config.js';
import { docker } from '@app/store/modules/docker.js';
import { dynamicRemoteAccessReducer } from '@app/store/modules/dynamic-remote-access.js';
import { dynamix } from '@app/store/modules/dynamix.js';
import { emhttp } from '@app/store/modules/emhttp.js';
import { mothership } from '@app/store/modules/minigraph.js';
import { paths } from '@app/store/modules/paths.js';
import { registration } from '@app/store/modules/registration.js';
import { remoteGraphQLReducer } from '@app/store/modules/remote-graphql.js';
import { upnp } from '@app/store/modules/upnp.js';
import type { AppDispatch, RootState } from '@app/store/types.js';

export const store = configureStore({
    reducer: {
        config: configReducer,
        dynamicRemoteAccess: dynamicRemoteAccessReducer,
        minigraph: mothership.reducer,
        paths: paths.reducer,
        remoteGraphQL: remoteGraphQLReducer,
        cache: cache.reducer,
        docker: docker.reducer,
        upnp: upnp.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).prepend(listenerMiddleware.middleware),
});

export type { AppDispatch, RootState };

export const getters = {
    cache: () => store.getState().cache,
    config: () => store.getState().config,
    docker: () => store.getState().docker,
    dynamicRemoteAccess: () => store.getState().dynamicRemoteAccess,
    minigraph: () => store.getState().minigraph,
    paths: () => store.getState().paths,
    remoteGraphQL: () => store.getState().remoteGraphQL,
    upnp: () => store.getState().upnp,
} as const;
