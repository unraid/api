/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chalk from 'chalk';
import { configure, getLogger as getRealLogger, type Logger } from 'log4js';
import { serializeError } from 'serialize-error';

export const levels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'] as const;

const contextEnabled = Boolean(process.env.LOG_CONTEXT);
const stackEnabled = Boolean(process.env.LOG_STACKTRACE);
const tracingEnabled = Boolean(process.env.LOG_TRACING);
const enabledCategories = (process.env.LOG_CATEGORY ?? '*')?.split(',');
const fullLoggingPattern = chalk`{gray [%d]} %x\{id\} %[[%p]%] %[[%c]%] %m{gray %x\{context\}}${tracingEnabled ? ' %[%f:%l%]' : ''}`;
const minimumLoggingPattern = '%m';
const appenders = process.env.LOG_TRANSPORT?.split(',').map(transport => transport.trim()) ?? ['out', 'errors'];
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

			const contextEntries = Object.entries(context)
				.map(([key, value]) => [key, value instanceof Error ? (stackEnabled ? serializeError(value) : value) : value])
				.filter(([key]) => key !== 'pid');
			const cleanContext = Object.fromEntries(contextEntries);
			return `\n${Object.entries(cleanContext).map(([key, value]) => `${key}=${JSON.stringify(value, null, 2)}`).join(' ')}`;
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
				layout: {
					...logLayout,
					// File logs should always be pretty
					pattern: fullLoggingPattern,
				},
			},
			errorFile: {
				type: 'file',
				filename: '/var/log/unraid-api/stderr.log',
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

const getNoOpLogger = (name: string): Logger => {
	const logger = getRealLogger(name);
	return {
		category: name,
		level: logger.level,
		log: noOp,
		_log: noOp,
		isLevelEnabled: logger.isLevelEnabled,
		isTraceEnabled: logger.isTraceEnabled,
		isDebugEnabled: logger.isDebugEnabled,
		isInfoEnabled: logger.isInfoEnabled,
		isWarnEnabled: logger.isWarnEnabled,
		isErrorEnabled: logger.isErrorEnabled,
		isFatalEnabled: logger.isFatalEnabled,
		addContext: noOp,
		removeContext: noOp,
		clearContext: noOp,
		setParseCallStackFunction: noOp,
		trace: noOp,
		debug: noOp,
		info: noOp,
		warn: noOp,
		error: noOp,
		fatal: noOp,
		mark: noOp,
	} as unknown as Logger;
};

const getLogger = (name: string) => {
	// Check if all are enabled
	if (enabledCategories?.includes('*')) return getRealLogger(name);
	// Check if this specific one is enabled
	if (enabledCategories?.includes(name)) return getRealLogger(name);
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
export const relayLogger = getLogger('relay');
export const minigraphLogger = getLogger('minigraph');
export const cloudConnectorLogger = getLogger('cloud-connector');
export const upnpLogger = getLogger('upnp');
export const loggers = [
	logger,
	mothershipLogger,
	dashboardLogger,
	emhttpLogger,
	libvirtLogger,
	graphqlLogger,
	dockerLogger,
	cliLogger,
	relayLogger,
	minigraphLogger,
	cloudConnectorLogger,
	upnpLogger,
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
