import { configureStore } from '@reduxjs/toolkit';
import { paths } from '@app/store/modules/paths';
import { mothership } from '@app/store/modules/minigraph';
import { configReducer } from '@app/store/modules/config';
import { servers } from '@app/store/modules/servers';
import { emhttp } from '@app/store/modules/emhttp';
import { registration } from '@app/store/modules/registration';
import { cache } from '@app/store/modules/cache';
import { dashboard } from '@app/store/modules/dashboard';
import { docker } from '@app/store/modules/docker';
import { upnp } from '@app/store/modules/upnp';
import { listenerMiddleware } from '@app/store/listeners/listener-middleware';
import { apiKeyReducer } from '@app/store/modules/apikey';
import { dynamicRemoteAccessReducer } from '@app/store/modules/dynamic-remote-access';
import { remoteGraphQLReducer } from '@app/store/modules/remote-graphql';

export const store = configureStore({
	reducer: {
		apiKey: apiKeyReducer,
		config: configReducer,
		dynamicRemoteAccess: dynamicRemoteAccessReducer,
		minigraph: mothership.reducer,
		paths: paths.reducer,
		servers: servers.reducer,
		emhttp: emhttp.reducer,
		registration: registration.reducer,
		remoteGraphQL: remoteGraphQLReducer,
		cache: cache.reducer,
		dashboard: dashboard.reducer,
		docker: docker.reducer,
		upnp: upnp.reducer,
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		serializableCheck: false,
	}).prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
	apiKey: () => store.getState().apiKey,
	config: () => store.getState().config,
	minigraph: () => store.getState().minigraph,
	paths: () => store.getState().paths,
	servers: () => store.getState().servers,
	emhttp: () => store.getState().emhttp,
	registration: () => store.getState().registration,
	remoteGraphQL: () => store.getState().remoteGraphQL,
	cache: () => store.getState().cache,
	dashboard: () => store.getState().dashboard,
	docker: () => store.getState().docker,
	upnp: () => store.getState().upnp,
};
