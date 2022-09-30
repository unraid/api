import { expect, test, vi } from 'vitest';

// Preloading imports for faster tests
import '@app/cli/log-to-syslog';

test('logs using the logger cli tool', async () => {
	vi.mock('execa');

	const { execaCommandSync } = await import('execa');
	const { logToSyslog } = await import('@app/cli/log-to-syslog');

	// Should send "test" to logger and resolve to void
	expect(logToSyslog('test')).toBe(undefined);
	expect(vi.mocked(execaCommandSync).mock.calls.length).toBe(1);
	expect(vi.mocked(execaCommandSync).mock.calls[0][0]).toBe(`logger -t unraid-api[${process.pid}] test`);
});
