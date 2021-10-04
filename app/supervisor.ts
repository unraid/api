import { join as joinPath, resolve as resolveToAbsolutePath } from 'path';
import { createWriteStream, mkdirSync, existsSync, lstatSync } from 'fs';
import { spawn as spawnProcess, ChildProcess } from 'child_process';
import locatePath from 'locate-path';
import psList from 'ps-list';
import { cyan, green, red } from 'nanocolors';
import intervalToHuman from 'interval-to-human';
import killProcess from 'fkill';
import cleanStack from 'clean-stack';

const createLogger = (namespace: string) => {
	const ns = namespace.toUpperCase();
	return {
		info(message: string, ...args: any[]) {
			console.info(`${cyan(`[${ns}]`)} ${message}`, ...args);
		},
		debug(message: string, ...args: any[]) {
			if (!isDebug) {
				return;
			}

			console.debug(`${green(`[${ns}]`)} ${message}`, ...args);
		},
		error(message: string, ...args: any[]) {
			console.error(`${red(`[${ns}][ERROR]`)} ${message}`, ...args);
		},
		print(message: string, ...args: any[]) {
			console.log(message, ...args);
		}
	};
};

const isDebug = process.env.DEBUG !== undefined;
const appName = 'unraid-api';
const logsPath = process.env.API_LOGS_PATH ?? '/var/log/unraid-api/';
const maxRestarts = 100;
const logger = createLogger('supervisor');

const isProcessRunning = async (name: string) => {
	const list = await psList();
	const runningProcesses = list
		// Don't return the process that ran this
		.filter(_process => _process.pid !== process.pid)
		.filter(process => {
			return name.startsWith(process.name) || process.name.endsWith(name) || (process.name === 'node' && process.cmd?.split(' ')[1]?.endsWith(name));
		});

	return {
		isRunning: runningProcesses.length !== 0,
		pids: runningProcesses.map(process => process.pid)
	};
};

const sleep = async (ms: number) => new Promise<void>(resolve => {
	setTimeout(() => {
		resolve();
	}, ms);
});

// Save the child process outside of startApi
// This is to allow us to kill it on exit
// and/or if the timeout happens when starting it
let apiProcess: ChildProcess;

const killOldProcesses = async (name: string, processName: string) => {
	const { isRunning, pids } = await isProcessRunning(processName);
	if (isRunning && pids.length !== 0) {
		logger.debug('Killing old %s process with pids %s', name, pids);
		await killProcess(pids);

		// Wait 1s for the old process to die
		await sleep(1_000);

		// Should be killed by now
		const isRunning = await isProcessRunning(processName);
		// If this is still somehow running then we need to bail.
		// This should only happen if you're running supervisor as a
		// user with less privileges then the one who started
		// the unraid-api process we're trying to kill.
		if (isRunning) {
			process.exitCode = 1;
		}
	}
};

const startApi = async (restarts = 0, shouldRestart = true) => {
	// Get an absolute path to the API binary
	const apiPath = resolveToAbsolutePath(process.env.UNRAID_API_BINARY_LOCATION ?? await locatePath([
		// Local dev
		resolveToAbsolutePath('./bin/unraid-api'),
		// Unraid OS
		'/usr/local/bin/unraid-api/bin/unraid-api'
	]) ?? '') ?? undefined;

	// If the unraid-api we found isn't a file then bail
	if (!lstatSync(apiPath).isFile()) {
		throw new Error('unraid-api binary couldn\'t be located.');
	}

	// Ensure the directories exist for the log files
	if (!existsSync(logsPath)) {
		logger.debug('Creating log directory %s', logsPath);
		mkdirSync(logsPath, { recursive: true });
	}

	// Either the new process will spawn
	// or it'll timeout/disconnect/exit
	logger.debug('Starting %s', appName);
	await Promise.race([
		new Promise<void>((resolve, reject) => {
			logger.debug('Spawning %s from %s', appName, apiPath);

			// Fork the child process
			const args = process.argv.slice(2);
			apiProcess = spawnProcess(apiPath, args, {
				stdio: 'pipe',
				env: {
					...process.env,
					DEBUG: undefined
				}
			});

			// Create stdout and stderr log files
			const logConsoleStream = createWriteStream(joinPath(logsPath, `${appName}.stdout.log`), { flags: 'a' });
			const logErrorStream = createWriteStream(joinPath(logsPath, `${appName}.stderr.log`), { flags: 'a' });

			// Redirect stdout and stderr to log files
			apiProcess.stdout?.pipe(logConsoleStream);
			apiProcess.stderr?.pipe(logErrorStream);

			// App has started
			apiProcess.stdout?.once('data', () => {
				logger.debug('%s has started', appName);
				resolve();
			});

			// App has thrown an error
			apiProcess.stderr?.once('data', (data: Buffer) => {
				logger.debug('%s threw an error %s', appName, data);
				reject(new Error(data.toString()));
			});

			// App has exited
			apiProcess.once('exit', async code => {
				const exitCode = code ?? 0;
				logger.debug('%s exited with code %s', appName, exitCode);

				// Increase timeout by 30s for every restart
				const initialTimeoutLength = restarts === 0 ? 30_000 : 30_000 * restarts;
				// Reset the timeout to 30s if it gets above 5 minutes
				const timeoutLength = initialTimeoutLength >= (60_000 * 5) ? 30_000 : initialTimeoutLength;

				// Wait for timer before restarting
				logger.info('Restarting %s in %s %s/%s', appName, intervalToHuman(timeoutLength), restarts + 1, maxRestarts);
				await sleep(timeoutLength);

				// Restart the app
				if (shouldRestart && restarts < maxRestarts) {
					logger.info('Restarting %s now %s/%s', appName, restarts + 1, maxRestarts);
					await startApi(restarts + 1).catch(error => {
						logger.error('Failed restarting %s with %s', appName, error);
					});
				}
			});

			logger.debug('Waiting for %s to start', appName);
		}),
		new Promise<void>((_resolve, reject) => {
			// Increase timeout by 30s for every restart
			const initialTimeoutLength = restarts === 0 ? 30_000 : 30_000 * restarts;
			// Reset the timeout to 30s if it gets above 5 minutes
			const timeoutLength = initialTimeoutLength >= (60_000 * 5) ? 30_000 : initialTimeoutLength;
			setTimeout(() => {
				reject(new Error(`Timed-out starting \`${appName}\`.`));
			}, timeoutLength);
		})
	]).catch((error: unknown) => {
		logger.error('Failed spawning %s with %s', appName, error);
		apiProcess?.kill();
	});
};

// On exit
const bindExitHook = async () => {
	let isExiting = false;
	const onExit = (shouldBail: boolean, signal: number) => {
		if (isExiting) {
			return;
		}

		// Kill api if it's still running
		if (apiProcess) {
			logger.debug('Killing %s process with pid %s', appName, apiProcess.pid);
			apiProcess.kill('SIGTERM');
		}

		isExiting = true;
		const exitCode = 128 + signal;
		logger.debug('Supervisor exited with code %s', exitCode);

		if (shouldBail) {
			process.exit(exitCode);
		}
	};

	process.once('exit', onExit);
	process.once('SIGINT', onExit.bind(undefined, true, 2));
	process.once('SIGTERM', onExit.bind(undefined, true, 15));
};

const startSupervisor = async () => {
	logger.debug('Starting supervisor');
	await bindExitHook();
	await killOldProcesses('supervisor', 'unsupervisor');
	await killOldProcesses('unraid-api', 'unraid-api');
	await startApi();
};

// Start supervisor
startSupervisor().catch(error => {
	logger.error('Failed starting %s with %s', appName, isDebug ? cleanStack(error) : error.message);
});
