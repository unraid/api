import { writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { Serializer as IniSerializer } from 'multi-ini';
import { addExitCallback } from 'catch-exit';
import { cliLogger } from '@app/core/log';
import { paths } from '@app/core/paths';
import { loadState } from '@app/core/utils/misc/load-state';
import { MyServersConfig } from '@app/types/my-servers-config';
import { fullVersion, version } from '@app/../package.json';
import { mainOptions } from '@app/cli/options';
import { logToSyslog } from '@app/cli/log-to-syslog';

/**
 * Start a new API process.
 */
export const start = async () => {
	// Set process title
	process.title = 'unraid-api';

	// Set cwd
	process.chdir(paths['unraid-api-base']);

	// Write current version to config file
	const configPath = paths['myservers-config'];
	const data = loadState<Partial<MyServersConfig>>(configPath);

	// Ini serializer
	const serializer = new IniSerializer({
		// This ensures it ADDs quotes
		keep_quotes: false,
	});

	// Stringify data
	const stringifiedData = serializer.serialize({
		...(data ?? {}),
		api: {
			...data?.api ?? {},
			version,
		},
	});

	// Update config file
	writeFileSync(configPath, stringifiedData);

	// Start API
	cliLogger.info('Starting unraid-api@v%s', fullVersion as string);

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
	const indexPath = './index.js';
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require(indexPath);

	if (!mainOptions.debug) {
		if ('_DAEMONIZE_PROCESS' in process.env) {
			// In the child, clean up the tracking environment variable
			delete process.env._DAEMONIZE_PROCESS;
		} else {
			cliLogger.debug('Daemonizing process.');

			// Spawn child
			const child = spawn(process.execPath, process.argv.slice(2), {
				// In the parent set the tracking environment variable
				env: Object.assign(process.env, { _DAEMONIZE_PROCESS: '1' }),
				// The process MUST have it's cwd set to the
				// path where it resides within the Nexe VFS
				cwd: paths['unraid-api-base'],
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
