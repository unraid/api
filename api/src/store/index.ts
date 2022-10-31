import { configureStore } from '@reduxjs/toolkit';
import { paths } from '@app/store/modules/paths';
import { minigraph } from '@app/store/modules/minigraph';
import { config } from '@app/store/modules/config';
import { nginx } from '@app/store/modules/nginx';
import { servers } from '@app/store/modules/servers';
import { emhttp } from '@app/store/modules/emhttp';
import { cache } from '@app/store/modules/cache';

export const store = configureStore({
	reducer: {
		config: config.reducer,
		minigraph: minigraph.reducer,
		paths: paths.reducer,
		nginx: nginx.reducer,
		servers: servers.reducer,
		emhttp: emhttp.reducer,
		cache: cache.reducer,
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
	nginx: () => store.getState().nginx,
	servers: () => store.getState().servers,
	emhttp: () => store.getState().emhttp,
	cache: () => store.getState().cache,
};
