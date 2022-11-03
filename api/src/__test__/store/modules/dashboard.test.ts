
import { defaultAppMiddleware } from '@app/store/middleware';
import { expect, test } from 'vitest';
import { dashboard } from '@app/store/modules/dashboard';
import { configureStore } from '@reduxjs/toolkit';

test('Before init returns default values for all fields', async () => {
	const store = configureStore({
		reducer: {
			dashboard: dashboard.reducer,
		},
		middleware: defaultAppMiddleware,
	});
	const state = store.getState().dashboard;
	expect(state).toMatchInlineSnapshot();
});
