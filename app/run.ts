import type { CoreContext, CoreResult, Result } from './core/types';
import { pubsub, coreLogger } from './core';
import { debugTimer, isNodeError, sleep } from './core/utils';
import { AppError } from './core/errors';
import { Logger } from 'logger';

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
	moduleToRun?: (context: CoreContext) => Promise<CoreResult | Result> | CoreResult | Result;
	context?: any;
	loop?: number;
}

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

	if (!moduleToRun) {
		coreLogger.silly('Tried to run but has no "moduleToRun"');
		await publish(channel, mutation, node);
		return;
	}

	try {
		// Run module
		const result: CoreResult = await Promise.resolve(moduleToRun(context));

		// Log result
		coreLogger.silly(`run:${moduleToRun.name} %j`, result.json);

		// Save result
		await publish(channel, mutation, result.json);

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
				coreLogger.debug('Error: %s', error.message);
			} else {
				const logger = coreLogger[error.status && error.status >= 400 ? 'error' : 'warn'].bind(coreLogger);
				logger('Error: %s', error.message);
			}
		} else {
			coreLogger.debug('Error: %s', error);
		}
	}
};

