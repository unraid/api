import { getNoOpLogger } from '@app/core/log/no-op';
import chalk from 'chalk';
import { configure, getLogger as getRealLogger, Layout } from 'log4js';
import { serializeError } from 'serialize-error';
import { LOGGER_OPTIONS } from '@app/consts';
export const levels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'] as const;


const FULL_LOGGING_PATTERN = chalk`{gray [%d]} %x\{id\} %[[%p]%] %[[%c]%] %m{gray %x\{context\}}${LOGGER_OPTIONS.IS_TRACING_ENABLED ? ' %[%f:%l%]' : ''}`;
const MINIMUM_LOGGING_PATTERN = '%m';

const logLayout: Layout = {
	type: 'pattern',
	// Depending on what this env is set to we'll either get raw or pretty logs
	// The reason we do this is to allow the app to change this value
	// This way pretty logs can be turned off programmatically
	pattern: LOGGER_OPTIONS.PRETTY_LOG ? FULL_LOGGING_PATTERN : MINIMUM_LOGGING_PATTERN,
	tokens: {
		id() {
			return chalk`{gray [${process.pid}]}`;
		},
		context({ context }: { context?: any }) {
			if (!LOGGER_OPTIONS.CONTEXT_ENABLED || !context) {
				return '';
			}

			try {
				const contextEntries = Object.entries(context)
					.map(([key, value]) => [key, value instanceof Error ? (LOGGER_OPTIONS.LOG_STACKTRACE ? serializeError(value) : value) : value])
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
				maxLogSize: '1M',
				backups: 0,
				layout: {...logLayout, pattern: FULL_LOGGING_PATTERN}
			},
			errorFile: {
				type: 'file',
				filename: '/var/log/unraid-api/stderr.log',
				maxLogSize: '1M',
				backups: 0,
				layout: {...logLayout, pattern: FULL_LOGGING_PATTERN }
			},
			out: {
				type: 'stdout',
				layout: logLayout,
			},
			errors: { type: 'logLevelFilter', appender: 'errorFile', level: 'error' },
		},
		categories: {
			default: {
				appenders: LOGGER_OPTIONS.ENABLED_TRANSPORTS,
				level: LOGGER_OPTIONS.LOG_LEVEL,
				enableCallStack: LOGGER_OPTIONS.IS_TRACING_ENABLED,
			},
		},
	});
} else {
	configure({
		appenders: {
			out: {
				type: 'stdout',
				layout: { logLayout, pattern: FULL_LOGGING_PATTERN },
			}
		},
		categories: {
			default: {
				appenders: ['out'],
				level: 'TRACE',
				enableCallStack: true
			}
		}
		
	})
}

const getLogger = (name: string) => {
	// Check if all are enabled
	if (LOGGER_OPTIONS.ENABLED_CATEGORIES?.includes('*')) return getRealLogger(name);
	// Check if this specific one is enabled
	if (LOGGER_OPTIONS.ENABLED_CATEGORIES?.includes(name)) return getRealLogger(name);
	return getNoOpLogger(name);
};

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
];

// Send SIGUSR1 to increase log level
process.on('SIGUSR1', () => {
	const level = typeof logger.level === 'string' ? logger.level : logger.level.levelStr;
	const nextLevel = "ALL";
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});

// Send SIGUSR1 to turn logging to warn
process.on('SIGUSR2', () => {
	const level = typeof logger.level === 'string' ? logger.level : logger.level.levelStr;
	const nextLevel = "WARN"
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});
