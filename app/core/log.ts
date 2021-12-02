/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chalk from 'chalk';
import { redactSecrets } from 'redact-secrets';
import { configure, getLogger } from 'log4js';
import { serializeError } from 'serialize-error';

const redact = redactSecrets('REDACTED', {
	keys: [],
	values: []
});

const levels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'] as const;

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
	// This way pretty logs can be turned off programatically
	pattern: () => process.env.LOG_TYPE === 'raw' ? minimumLoggingPattern : fullLoggingPattern,
	tokens: {
		id() {
			return chalk`{gray [${process.pid}]}`;
		},
		context({ context }: { context?: any }) {
			if (!contextEnabled) {
				return '';
			}

			const contextEntries = Object.entries(context)
				.map(([key, value]) => [key, value instanceof Error ? (stackEnabled ? serializeError(value) : value) : value])
				.filter(([key]) => key !== 'pid');
			const cleanContext = Object.fromEntries(contextEntries);
			return ` ${context as string}` ? (' ' + Object.entries(redact.map(cleanContext)).map(([key, value]) => `${key}=${JSON.stringify(value, null, 2)}`).join(' ')) : '';
		}
	}
};

// We log to both the stdout and log file
// The log file should be changed to errors only unless in debug mode
configure({
	appenders: {
		file: {
			type: 'file',
			filename: '/var/log/unraid-api/unraid-api.log',
			layout: logLayout
		},
		out: {
			type: 'stdout',
			layout: logLayout
		}
	},
	categories: {
		default: {
			appenders,
			level,
			enableCallStack: tracingEnabled
		}
	}
});

export const internalLogger = getLogger('internal');
export const logger = getLogger('app');
export const mothershipLogger = getLogger('mothership');
export const libvirtLogger = getLogger('libvirt');
export const graphqlLogger = getLogger('graphql');
export const dockerLogger = getLogger('docker');
export const cliLogger = getLogger('cli');
export const nchanLogger = getLogger('nchan');
export const relayLogger = getLogger('relay');
export const apiManagerLogger = getLogger('api-manager');
export const loggers = [
	logger,
	mothershipLogger,
	libvirtLogger,
	graphqlLogger,
	dockerLogger,
	cliLogger,
	nchanLogger,
	relayLogger,
	apiManagerLogger
];

// Send SIGUSR1 to increase log level
process.on('SIGUSR1', () => {
	const level = `${logger.level}`;
	const nextLevel = levels[levels.findIndex(_level => _level === level) + 1] ?? levels[0];
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});

// Send SIGUSR1 to decrease log level
process.on('SIGUSR2', () => {
	const level = `${logger.level}`;
	const nextLevel = levels[levels.findIndex(_level => _level === level) - 1] ?? levels[levels.length - 1];
	loggers.forEach(logger => {
		logger.level = nextLevel;
	});
	internalLogger.mark('Log level changed from %s to %s', level, nextLevel);
});
