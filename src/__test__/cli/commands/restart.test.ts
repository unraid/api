import { expect, test, vi } from 'vitest';

test('calls stop and then start', async () => {
	vi.mock('@app/cli/commands/start');
	vi.mock('@app/cli/commands/stop');

	// Call restart
	const { restart } = await import('@app/cli/commands/restart');
	const { start } = await import('@app/cli/commands/start');
	const { stop } = await import('@app/cli/commands/stop');
	await restart();

	// Check stop was called
	expect(vi.mocked(stop).mock.calls.length).toBe(1);

	// Check start was called
	expect(vi.mocked(start).mock.calls.length).toBe(1);

	// Check stop was called first
	expect(vi.mocked(stop).mock.invocationCallOrder).toStrictEqual([1]);
	expect(vi.mocked(start).mock.invocationCallOrder).toStrictEqual([2]);
});
