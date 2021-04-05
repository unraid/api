/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Are we in produciton node env?
 *
 * Note: This isn't the same as the environment.
 */
const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
  * Logger reworked
  *
  * We use logger but only in development/staging.
  *
  * When in production we use a noop function for all levels apart from error.
  * This ensures we still see errors in all enviroments but allows us to use to
  * the performance gains of not filling the stdout buffer when silly or trace is
  * being hit.
  */
export const logger = {
	createChild: (_options: { prefix: string }) => log,
	debug: isProduction ? noop : console.debug,
	// Always allow errors to log
	error: console.error,
	level: 'error',
	levels: ['error', 'warn', 'info', 'debug', 'trace', 'silly'],
	info: isProduction ? noop : console.info,
	log: isProduction ? noop : console.info,
	silly: isProduction ? noop : console.debug,
	timer: isProduction ? noop : console.debug,
	trace: isProduction ? noop : console.debug,
	transport: 'console',
	transports: ['console'],
	warn: isProduction ? noop : console.debug
};

export const log = logger.createChild({ prefix: '@unraid' });
export const coreLogger = log.createChild({ prefix: 'core' });
export const graphqlLogger = log.createChild({ prefix: 'graphql' });
export const relayLogger = log.createChild({ prefix: 'relay' });
export const discoveryLogger = log.createChild({ prefix: 'discovery' });
export const apiManagerLogger = log.createChild({ prefix: 'api-manager' });
