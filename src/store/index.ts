import { paths } from '@app/store/modules/paths';
import { configureStore } from '@reduxjs/toolkit';
import { config, loadConfigFile } from './modules/config';

export const store = configureStore({
	reducer: {
		config: config.reducer,
		paths: paths.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
	config: () => store.getState().config,
	paths: () => store.getState().paths,
};
