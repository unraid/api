import type { CoreContext, CoreResult } from './core/types';
import { pubsub, logger } from './core';
import { isNodeError } from './core/utils';
import { AppError } from './core/errors';
import { sleep } from './core/utils/misc/sleep';

/**
 * Publish update to topic channel.
 */
export const publish = async (channel: string, mutation: string, node?: Record<string, unknown>) => {
	if (!node) {
		throw new Error('Data missing?');
	}

	const data = {
		[channel]: {
			mutation,
			node
		}
	};

	// Update clients
	const fieldName = Object.keys(data)[0];
	await pubsub.publish(channel, {
		[fieldName]: data[fieldName].node
	});
};

interface RunOptions {
	node?: Record<string, unknown>;
	moduleToRun?: (context: CoreContext) => Promise<CoreResult> | CoreResult;
	context?: any;
	loop?: number;
}

// Mark if process is exiting
// so we can exit the run loop
let exiting = false;
process.on('SIGTERM', () => {
	exiting = true;
});

/**
 * Run a module.
 */
export const run = async (channel: string, mutation: string, options: RunOptions) => {
	const timestamp = new Date().getTime();
	const {
		node,
		moduleToRun,
		context,
		loop
	} = options;

	if (exiting) {
		logger.trace('Process is exiting, stopping %s loop!', channel);
		return;
	}

	if (!moduleToRun) {
		logger.trace('Tried to run but has no "moduleToRun"');
		await publish(channel, mutation, node);
		return;
	}

	try {
		// Run module
		const result: CoreResult = await Promise.resolve(moduleToRun(context));

		// Log result
		logger.addContext('result', result);
		logger.trace(`run:${moduleToRun.name}`);
		logger.removeContext('result');

		// Save result
		await publish(channel, mutation, result.json as any);

		// Bail as we're done looping
		if (!loop || loop === 0) {
			return;
		}

		// If we haven't waited long enough wait a little more
		const timeTaken = (new Date().getTime() - timestamp);
		const minimumTime = 1000;
		if (timeTaken < minimumTime) {
			await sleep(minimumTime - timeTaken);
		}

		// Run the next loop
		return run(channel, mutation, {
			...options,
			loop: loop - 1
		});
	} catch (error: unknown) {
		if (isNodeError(error, AppError)) {
			// Ensure we aren't leaking anything in production
			if (process.env.NODE_ENV === 'production') {
				logger.debug('Error: %s', error.message);
			} else {
				logger[error.status && error.status >= 400 ? 'error' : 'warn'].bind(logger)('Error: %s', error.message);
			}
		} else {
			logger.debug('Error: %s', error);
		}
	}
};

