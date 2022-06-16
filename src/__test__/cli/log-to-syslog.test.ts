import { expect, test, vi } from 'vitest';

test('logs using the logger cli tool', async () => {
	vi.mock('execa');

	const { commandSync } = await import('execa');
	const { logToSyslog } = await import('@app/cli/log-to-syslog');

	// Should send "test" to logger and resolve to void
	expect(logToSyslog('test')).toBe(undefined);
	expect(vi.mocked(commandSync).mock.calls.length).toBe(1);
	expect(vi.mocked(commandSync).mock.calls[0][0]).toBe(`logger -t unraid-api[${process.pid}] test`);
});
