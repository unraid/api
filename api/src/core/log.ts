import chalk from 'chalk';
import { configure, getLogger } from 'log4js';
import { serializeError } from 'serialize-error';

export const levels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'] as const;

const contextEnabled = Boolean(process.env.LOG_CONTEXT);
const stackEnabled = Boolean(process.env.LOG_STACKTRACE);
const tracingEnabled = Boolean(process.env.LOG_TRACING);
const fullLoggingPattern = chalk`{gray [%d]} %x\{id\} %[[%p]%] %[[%c]%] %m{gray %x\{context\}}${tracingEnabled ? ' %[%f:%l%]' : ''}`;
const minimumLoggingPattern = '%m';
const appenders = process.env.LOG_TRANSPORT?.split(',').map(transport => transport.trim()) ?? ['out'];
const level = levels[levels.indexOf(process.env.LOG_LEVEL?.toUpperCase() as typeof levels[number])] ?? 'INFO';
const logLayout = {
	type: 'pattern',
	// Depending on what this env is set to we'll either get raw or pretty logs
	// The reason we do this is to allow the app to change this value
	// This way pretty logs can be turned off programmatically
	pattern: process.env.LOG_TYPE === 'pretty' ? fullLoggingPattern : minimumLoggingPattern,
	tokens: {
		id() {
			return chalk`{gray [${process.pid}]}`;
		},
		context({ context }: { context?: any }) {
			if (!contextEnabled || !context) {
				return '';
			}

			try {
				const contextEntries = Object.entries(context)
					.map(([key, value]) => [key, value instanceof Error ? (stackEnabled ? serializeError(value) : value) : value])
					.filter(([key]) => key !== 'pid');
				const cleanContext = Object.fromEntries(contextEntries);
				return `\n${Object.entries(cleanContext).map(([key, value]) => `${key}=${JSON.stringify(value, null, 2)}`).join(' ')}`;
			} catch (error: unknown) {
				const errorInfo = error instanceof Error ? `${error.message}: ${error.stack ?? 'no stack'}` : 'Error not instance of error';
				return `Error generating context: ${errorInfo}`;
			}
		},
	},
};

if (process.env.NODE_ENV !== 'test') {
	// We log to both the stdout and log file
	// The log file should be changed to errors only unless in debug mode
	configure({
		appenders: {
			file: {
				type: 'file',
				filename: '/var/log/unraid-api/stdout.log',
				maxLogSize: 10_000_000,
				backups: 0,
				layout: {
					...logLayout,
					// File logs should always be pretty
					pattern: fullLoggingPattern,
				},
			},
			errorFile: {
				type: 'file',
				filename: '/var/log/unraid-api/stderr.log',
				maxLogSize: 2_500_000,
				backups: 0,
				layout: {
					...logLayout,
					// File logs should always be pretty
					pattern: fullLoggingPattern,
				},
			},
			out: {
				type: 'stdout',
				layout: logLayout,
			},
			errors: { type: 'logLevelFilter', appender: 'errorFile', level: 'error' },
		},
		categories: {
			default: {
				appenders,
				level,
				enableCallStack: tracingEnabled,
			},
		},
	});
}

export const internalLogger = getLogger('internal');
export const logger = getLogger('app');
export const mothershipLogger = getLogger('mothership');
export const dashboardLogger = getLogger('dashboard');
export const emhttpLogger = getLogger('emhttp');
export const libvirtLogger = getLogger('libvirt');
export const graphqlLogger = getLogger('graphql');
export const dockerLogger = getLogger('docker');
export const cliLogger = getLogger('cli');
export const minigraphLogger = getLogger('minigraph');
export const cloudConnectorLogger = getLogger('cloud-connector');
export const upnpLogger = getLogger('upnp');
export const keyServerLogger = getLogger('key-server');
export const remoteAccessLogger = getLogger('remote-access');
export const remoteQueryLogger = getLogger('remote-query');

export const loggers = [
	logger,
	mothershipLogger,
	dashboardLogger,
	emhttpLogger,
	libvirtLogger,
	graphqlLogger,
	dockerLogger,
	cliLogger,
	minigraphLogger,
	cloudConnectorLogger,
	upnpLogger,
	keyServerLogger,
	remoteAccessLogger,
	remoteQueryLogger,
];

// Send SIGUSR1 to increase log level
process.on('SIGUSR1', () => {
	const level = typeof logger.level === 'string' ? logger.level : logger.level.levelStr;
	const nextLevel = levels[levels.findIndex(_level => _level === level) + 1] ?? levels[0];
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});

// Send SIGUSR1 to decrease log level
process.on('SIGUSR2', () => {
	const level = typeof logger.level === 'string' ? logger.level : logger.level.levelStr;
	const nextLevel = levels[levels.findIndex(_level => _level === level) - 1] ?? levels[levels.length - 1];
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});
