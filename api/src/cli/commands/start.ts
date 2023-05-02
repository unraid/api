import { spawn } from 'child_process';
import { addExitCallback } from 'catch-exit';
import { cliLogger } from '@app/core/log';
import { mainOptions } from '@app/cli/options';
import { logToSyslog } from '@app/cli/log-to-syslog';
import { getters } from '@app/store';
import { getAllUnraidApiPids } from '@app/cli/get-unraid-api-pid';
import { API_VERSION } from '@app/environment';

/**
 * Start a new API process.
 */
export const start = async () => {
	// Set process title
	process.title = 'unraid-api';
	const runningProcesses = await getAllUnraidApiPids();
	if (runningProcesses.length > 0) {
		cliLogger.info('unraid-api is Already Running!');
		cliLogger.info('Run "unraid-api restart" to stop all running processes and restart');
		process.exit(1);
	}

	// Start API
	cliLogger.info('Starting unraid-api@v%s', API_VERSION);

	// If we're in debug mode or we're NOT
	// in debug but ARE in the child process
	if (mainOptions.debug || process.env._DAEMONIZE_PROCESS) {
		// Log when the API exits
		addExitCallback((signal, exitCode, error) => {
			if (exitCode === 0 || exitCode === 130 || signal === 'SIGTERM') {
				logToSyslog('👋 Farewell. UNRAID API shutting down!');
				return;
			}

			// Log when the API crashes
			if (signal === 'uncaughtException' && error) {
				logToSyslog(`⚠️ Caught exception: ${error.message}`);
			}

			// Log when we crash
			if (exitCode) {
				logToSyslog(`⚠️ UNRAID API crashed with exit code ${exitCode}`);
				return;
			}

			logToSyslog('🛑 UNRAID API crashed without an exit code?');
		});

		logToSyslog('✔️ UNRAID API started successfully!');
	}

	// Load bundled index file
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('../../index');

	if (!mainOptions.debug) {
		if ('_DAEMONIZE_PROCESS' in process.env) {
			// In the child, clean up the tracking environment variable
			delete process.env._DAEMONIZE_PROCESS;
		} else {
			cliLogger.debug('Daemonizing process. %s %o', process.execPath, process.argv);

			// Spawn child
			// First arg is path (inside PKG), second arg is restart, stop, etc, rest is args to main argument
			const [path, , ...rest] = process.argv.slice(1);
			const replacedCommand = [path, 'start', ...rest];
			const child = spawn(process.execPath, replacedCommand, {
				// In the parent set the tracking environment variable
				env: Object.assign(process.env, { _DAEMONIZE_PROCESS: '1' }),
				// The process MUST have it's cwd set to the
				// path where it resides within the Nexe VFS
				cwd: getters.paths()['unraid-api-base'],
				stdio: 'ignore',
				detached: true,
			});

			// Convert process into daemon
			child.unref();

			cliLogger.debug('Daemonized successfully!');

			// Exit cleanly
			process.exit(0);
		}
	}
};
