/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chalk from 'chalk';
import { redactSecrets } from 'redact-secrets';
import { configure, getLogger } from 'log4js';
import { serializeError } from 'serialize-error';

const logger = getLogger('app');

const redact = redactSecrets('REDACTED', {
	keys: [],
	values: []
});

const levels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'] as const;
const contextEnabled = Boolean(process.env.LOG_CONTEXT);
const stackEnabled = Boolean(process.env.LOG_STACKTRACE);
const tracingEnabled = Boolean(process.env.LOG_TRACING);
const rawLogs = process.env.LOG_TYPE === 'raw';
const level = levels[levels.indexOf(process.env.LOG_LEVEL?.toUpperCase() as typeof levels[number])] ?? 'INFO';

const fullLoggingPattern = chalk`{gray [%d]} %x\{id\} %[[%p]%] %[[%c]%] %m{gray %x\{context\}}${tracingEnabled ? ' %[%f:%l%]' : ''}`;
const minimumLoggingPattern = '%m';

configure({
	appenders: {
		app: {
			type: 'stdout',
			layout: {
				type: 'pattern',
				pattern: rawLogs ? minimumLoggingPattern : fullLoggingPattern,
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
			}
		}
	},
	categories: {
		default: { appenders: ['app'], level, enableCallStack: tracingEnabled }
	}
});

// Send SIGUSR1 to increase log level
process.on('SIGUSR1', () => {
	const level = `${logger.level}`;
	const nextLevel = levels[levels.findIndex(_level => _level === level) + 1] ?? levels[0];
	logger.level = nextLevel;
	logger.mark('Log level changed from %s to %s', level, nextLevel);
});

// Send SIGUSR1 to decrease log level
process.on('SIGUSR2', () => {
	const level = `${logger.level}`;
	const nextLevel = levels[levels.findIndex(_level => _level === level) - 1] ?? levels[levels.length - 1];
	logger.level = nextLevel;
	logger.mark('Log level changed from %s to %s', level, nextLevel);
});

export const log = getLogger('app');
