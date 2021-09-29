import { join as joinPath, resolve as resolveToAbsolutePath } from 'path';
import { createWriteStream, mkdirSync, existsSync, lstatSync } from 'fs';
import { spawn as spawnProcess, ChildProcess } from 'child_process';
import locatePath from 'locate-path';
import psList from 'ps-list';
import { cyan, green, yellow, red } from 'nanocolors';
import intervalToHuman from 'interval-to-human';

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
		warning(message: string, ...args: any[]) {
			console.warn(`${yellow(`[${ns}][WARNING]`)} ${message}`, ...args);
		},
		error(message: string | Error, ...args: any[]) {
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
const instances = 1;
const maxRestarts = 100;
const logger = createLogger('supervisor');

let apiPid: number;
const isApiRunning = async () => {
	const list = await psList();
	const api = list.find(process => {
		return process.name.endsWith('unraid-api') || (process.name === 'node' && process.cmd?.split(' ')[1]?.endsWith('unraid-api'));
	});
	if (api) {
		apiPid = api.pid;
	}

	return api !== undefined;
};

const sleep = async (ms: number) => new Promise<void>(resolve => {
	setTimeout(() => {
		resolve();
	}, ms);
});

export const startApi = async (restarts = 0, shouldRestart = true) => {
	const isRunning = await isApiRunning();
	if (isRunning) {
		logger.debug('%s process is running with pid %s', appName, apiPid);
		return;
	}

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
	const logDirectory = joinPath(logsPath, 'apps');
	if (!existsSync(logDirectory)) {
		logger.debug('Creating log directory %s', logDirectory);
		mkdirSync(logDirectory, { recursive: true });
	}

	// Save the child process outside of the race
	// This is to allow us to kill it if the timeout is quicker
	let childProcess: ChildProcess;

	// Either the new process will spawn
	// or it'll timeout/disconnect/exit
	logger.debug('Starting %s.', appName);
	await Promise.race([
		new Promise<void>((resolve, reject) => {
			logger.debug('Spawning %s instance%s of %s from %s', instances, instances === 1 ? '' : 's', appName, apiPath);

			// Fork the child process
			childProcess = spawnProcess(apiPath, ['start', '--debug'], {
				stdio: 'pipe'
			});

			// Create stdout and stderr log files
			const logConsoleStream = createWriteStream(joinPath(logDirectory, `${appName}.stdout.log`), { flags: 'a' });
			const logErrorStream = createWriteStream(joinPath(logDirectory, `${appName}.stderr.log`), { flags: 'a' });

			// Redirect stdout and stderr to log files
			childProcess.stdout?.pipe(logConsoleStream);
			childProcess.stderr?.pipe(logErrorStream);

			// App has started
			childProcess.stdout?.once('data', () => {
				logger.debug('%s has started', appName);
				resolve();
			});

			// App has thrown an error
			childProcess.stderr?.once('data', (data: Buffer) => {
				logger.debug('%s threw an error %s', appName, data);
				reject(new Error(data.toString()));
			});

			// App has exited
			childProcess.once('exit', async code => {
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
		childProcess?.kill();
	});
};

startApi().catch(error => {
	logger.error('Failed starting %s with %s', appName, isDebug ? error : error.message);
});
