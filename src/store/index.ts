import { configureStore } from '@reduxjs/toolkit';
import { paths } from '@app/store/modules/paths';
import { minigraph } from '@app/store/modules/minigraph';
import { config, FileLoadStatus } from '@app/store/modules/config';
import { writeFile } from 'fs/promises';
import { Serializer as IniSerializer } from 'multi-ini';
import { logger } from '@app/core/log';

export const store = configureStore({
	reducer: {
		config: config.reducer,
		minigraph: minigraph.reducer,
		paths: paths.reducer,
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		serializableCheck: {
			ignoredPaths: ['minigraph.client', 'minigraph.subscriptions'],
			ignoredActions: ['minigraph/addSubscription', 'minigraph/createNewClient/fulfilled', 'minigraph/setClient'],
		},
	}),
});

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

store.subscribe(async () => {
	const { config } = store.getState();
	if (config.status !== FileLoadStatus.LOADED) return;

	const paths = await import('@app/store').then(_ => _.getters.paths());
	logger.debug('Dumping MyServers config back to file');

	// Get current state
	const { api, local, notifier, remote, upc } = config;

	// Stringify state
	const stringifiedData = serializer.serialize({ api, local, notifier, remote, upc });

	// Update config file
	await writeFile(paths['myservers-config'], stringifiedData);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
	config: () => store.getState().config,
	minigraph: () => store.getState().minigraph,
	paths: () => store.getState().paths,
};
