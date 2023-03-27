import { expect, test, vi } from 'vitest';
import { stop } from '@app/cli/commands/stop';
import { spawn } from 'node:child_process';
import { cliLogger } from '@app/core/log';
import { sleep } from '@app/core/utils/misc/sleep';

import { getAllUnraidApiPids } from '@app/cli/get-unraid-api-pid';
import path from 'node:path';

const spawnUnraidApiTestDaemon = (difficulty: 'easy' | 'hard') => {
	const pathToJsFile = difficulty === 'easy' ? '../../setup/child-process-easy-to-kill.js' : '../../setup/child-process-hard-to-kill.js';
	// Spawn child
	console.log('Spawning child process at', path.join(__dirname, pathToJsFile));
	const child = spawn('node', [path.join(__dirname, pathToJsFile)], {
		// In the parent set the tracking environment variable
		env: Object.assign(process.env, { _DAEMONIZE_PROCESS: '1' }),

		stdio: 'ignore',
		detached: true,
	});

	// Convert process into daemon
	child.unref();

	cliLogger.debug('Daemonized successfully!');
};

test('It stops successfully (easy)', async () => {
	spawnUnraidApiTestDaemon('easy');
	spawnUnraidApiTestDaemon('easy');

	await sleep(100);

	const { cliLogger } = await import('@app/core/log');
	const loggerSpy = vi.spyOn(cliLogger, 'info');

	const pids = await getAllUnraidApiPids();
	expect(pids.length).toBe(2);
	await stop();
	const pids2 = await getAllUnraidApiPids();
	expect(pids2.length).toBe(0);
	expect(loggerSpy).toHaveBeenNthCalledWith(1,
		'Stopping %s unraid-api process(es)...',
		2,
	);
});

test('It stops successfully (easy and hard)', async () => {
	spawnUnraidApiTestDaemon('easy');
	spawnUnraidApiTestDaemon('easy');
	spawnUnraidApiTestDaemon('hard');
	spawnUnraidApiTestDaemon('hard');

	await sleep(100);

	const { cliLogger } = await import('@app/core/log');
	const loggerSpy = vi.spyOn(cliLogger, 'info');

	const pids = await getAllUnraidApiPids();
	expect(pids.length).toBe(4);
	await stop();
	const pids2 = await getAllUnraidApiPids();
	expect(pids2.length).toBe(0);
	expect(loggerSpy).toHaveBeenNthCalledWith(1,
		'Stopping %s unraid-api process(es)...',
		4,
	);
	expect(loggerSpy).toHaveBeenNthCalledWith(2,
		'Stopping %s unraid-api process(es)...',
		2,
	);
	expect(loggerSpy).toHaveBeenNthCalledWith(3,
		'Stopping %s unraid-api process(es)...',
		2,
	);
	expect(loggerSpy).toHaveBeenNthCalledWith(4, 'Process did not exit cleanly, forcing shutdown', expect.any(Error));
}, 15_000);

