import { configureStore } from '@reduxjs/toolkit';
import { paths } from '@app/store/modules/paths';
import { minigraph } from '@app/store/modules/minigraph';
import { config } from '@app/store/modules/config';
import { servers } from '@app/store/modules/servers';
import { emhttp } from '@app/store/modules/emhttp';
import { registration } from '@app/store/modules/registration';
import { cache } from '@app/store/modules/cache';
import { dashboard } from '@app/store/modules/dashboard';
import { docker } from '@app/store/modules/docker';

export const store = configureStore({
	reducer: {
		config: config.reducer,
		minigraph: minigraph.reducer,
		paths: paths.reducer,
		servers: servers.reducer,
		emhttp: emhttp.reducer,
		registration: registration.reducer,
		cache: cache.reducer,
		dashboard: dashboard.reducer,
		docker: docker.reducer,
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		serializableCheck: {
			ignoredPaths: ['minigraph.client', 'minigraph.subscriptions', 'cache.nodeCache'],
			ignoredActions: ['minigraph/addSubscription', 'minigraph/createNewClient/fulfilled', 'minigraph/setClient'],
		},
	}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
	config: () => store.getState().config,
	minigraph: () => store.getState().minigraph,
	paths: () => store.getState().paths,
	servers: () => store.getState().servers,
	emhttp: () => store.getState().emhttp,
	registration: () => store.getState().registration,
	cache: () => store.getState().cache,
	dashboard: () => store.getState().dashboard,
	docker: () => store.getState().docker,
};
