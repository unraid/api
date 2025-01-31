import { configureStore } from '@reduxjs/toolkit';

import { listenerMiddleware } from '@app/store/listeners/listener-middleware';
import { cache } from '@app/store/modules/cache';
import { configReducer } from '@app/store/modules/config';
import { docker } from '@app/store/modules/docker';
import { dynamicRemoteAccessReducer } from '@app/store/modules/dynamic-remote-access';
import { dynamix } from '@app/store/modules/dynamix';
import { emhttp } from '@app/store/modules/emhttp';
import { mothership } from '@app/store/modules/minigraph';
import { notificationReducer } from '@app/store/modules/notifications';
import { paths } from '@app/store/modules/paths';
import { registration } from '@app/store/modules/registration';
import { remoteGraphQLReducer } from '@app/store/modules/remote-graphql';
import { upnp } from '@app/store/modules/upnp';

export const store = configureStore({
    reducer: {
        config: configReducer,
        dynamicRemoteAccess: dynamicRemoteAccessReducer,
        minigraph: mothership.reducer,
        paths: paths.reducer,
        emhttp: emhttp.reducer,
        registration: registration.reducer,
        remoteGraphQL: remoteGraphQLReducer,
        notifications: notificationReducer,
        cache: cache.reducer,
        docker: docker.reducer,
        upnp: upnp.reducer,
        dynamix: dynamix.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
    cache: () => store.getState().cache,
    config: () => store.getState().config,
    docker: () => store.getState().docker,
    dynamicRemoteAccess: () => store.getState().dynamicRemoteAccess,
    dynamix: () => store.getState().dynamix,
    emhttp: () => store.getState().emhttp,
    minigraph: () => store.getState().minigraph,
    notifications: () => store.getState().notifications,
    paths: () => store.getState().paths,
    registration: () => store.getState().registration,
    remoteGraphQL: () => store.getState().remoteGraphQL,
    upnp: () => store.getState().upnp,
};
