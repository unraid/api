import { configureStore } from '@reduxjs/toolkit';
import { version } from './modules/version';

export const store = configureStore({
	reducer: {
		version: version.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
