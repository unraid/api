import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../../../core/states/var', () => ({
	varState: {
		data: {
			mdState: 'STARTED'
		}
	}
}));

beforeEach(() => {
	vi.resetModules();
});

test('Returns false if the array is stopped', async () => {
	const { varState } = await import('../../../../core/states/var');
	const { arrayIsRunning } = await import('../../../../core/utils/array/array-is-running');
	varState.data.mdState = 'STOPPED';
	expect(varState.data.mdState).toBe('STOPPED');
	expect(arrayIsRunning()).toBe(false);
});

test('Returns true if the array is started', async () => {
	const { varState } = await import('../../../../core/states/var');
	const { arrayIsRunning } = await import('../../../../core/utils/array/array-is-running');
	expect(varState.data.mdState).toBe('STARTED');
	expect(arrayIsRunning()).toBe(true);
});
