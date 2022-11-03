
import { defaultAppMiddleware } from '@app/store/middleware';
import { configureStore } from '@reduxjs/toolkit';
import { expect, test } from 'vitest';

test('Before init returns default values for all fields', async () => {
	const { dashboard } = await import ('@app/store/modules/dashboard');
	const store = configureStore({
		reducer: {
			dashboard: dashboard.reducer,
		},
		middleware: defaultAppMiddleware,
	});
	const state = store.getState().dashboard;
	expect(state).toMatchInlineSnapshot();
});
