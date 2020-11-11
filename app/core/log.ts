/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { existsSync } from 'fs';
import { format } from 'util';
import { redactSecrets } from 'redact-secrets';
import SysLogger from 'ain2';
import { config } from './config';

const noop = () => {};

// If warning is selected then only 4, 5 and 6 will be shown
// All others will be set to a noop function.
const levels = {
	trace: 0 as const,
	debug: 1 as const,
	info: 2 as const,
	warning: 3 as const,
	error: 4 as const,
	fatal: 5 as const,
	silent: 6 as const
};

const env = config.get('node-env');
const prod = env === 'production';
const silent = env === 'test';
const debug = config.get('debug');

const loggerExists = (path: string) => existsSync(path) ? path : undefined;
const loggerPath = [loggerExists('/dev/log'), loggerExists('/var/run/syslog')].filter(Boolean);
const syslog = new SysLogger({
	tag: 'node',
	path: loggerPath
});

syslog.setMessageComposer(function(message: string, severity: number) {
	const severityLevel = {
		0: 'emergency',
		1: 'alert',
		2: 'critical',
		3: 'error',
		4: 'warning',
		5: 'notice',
		6: 'info',
		7: 'debug'
	};
	// @ts-ignore
	return new Buffer(`<${this.facility * 8 + severity}> ${this.tag} [${severityLevel[severity]}]: ${message}`);
});

// Replace secrets with the following
const redact = redactSecrets('[REDACTED]', {
	keys: [],
	values: []
});

/**
 * Set the starting level
 *
 * "NODE_ENV=test" - all logs are silenced
 * "DEBUG=true" - all logs printed via console
 *
 * By default only info and above logs are printed.
 */
let currentLogLevel = silent ? levels.silent : (levels[Object.keys(levels).includes(process.env.LOG_LEVEL!) ? process.env.LOG_LEVEL as keyof typeof levels : (prod ? 'info' : 'debug')]);

const aliases = {
	log: 'info',
	warning: 'warn'
};

const logger = (level: keyof typeof logger) => (message?: any, ...optionalParams: any[]) => {
	const resolvedLevel = Object.keys(aliases).includes(String(level)) ? aliases[level] : level;

	// Only log if the level is the same or higher,
	// For example level = 6 would mean only fatal logs are shown
	// 			   level = 0 would show every single log
	if (levels[level] >= currentLogLevel) {
		// Only log to console when in debug mode
		// This is mainly used when running this on a
		// non-unraid system as syslog isn't always accessible
		const args = format(message, ...optionalParams.map(param => redact.map(param)));
		const log = debug ? console[resolvedLevel] : syslog[resolvedLevel].bind(syslog);
		return log(args);
	}
};

/**
 * Main logger.
 */
export const log = {
	trace: logger('trace'),
	debug: logger('debug'),
	info: logger('info'),
	error: logger('error'),
	warning: logger('warning'),
	timer: process.env.TIMERS ? logger('debug') : noop,
	/**
	 * Update the current log level
	 * @param level string | number of log level
	 */
	setLevel(level: keyof typeof levels) {
		// Only update if in allowed levels
		if (!Object.keys(levels).includes(level)) {
			this.warning(`Invalid level ${level}, try one of the following ${Object.keys(levels)}.`);
			return currentLogLevel;
		}

		// Update level
		currentLogLevel = levels[level];

		// Return newly set level
		return currentLogLevel;
	},
	getLevel: () => currentLogLevel,
	getLevelName: () => {
		const level = Object.entries(levels).find(([key, value]) => value === currentLogLevel);
		return level?.[0];
	}
};

process.on('SIGUSR2', () => {
	if (log.getLevel() === levels.debug) {
		log.setLevel('info');
	} else {
		log.setLevel('debug');
	}

	log.info(`Log level updated to ${log.getLevelName()}.`);
});
