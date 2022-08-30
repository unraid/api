import { configureStore } from '@reduxjs/toolkit';
import { config } from './modules/config';

export const store = configureStore({
	reducer: {
		config: config.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getters = {
	config: () => store.getState().config,
};
