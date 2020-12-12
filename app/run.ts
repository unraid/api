import type { CoreResult } from './core/types';
import { pubsub, coreLogger } from './core';
import { debugTimer } from './core/utils';

/**
 * Publish update to topic channel.
 */
export const publish = (channel: string, mutation: string, node?: {}) => {
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
    pubsub.publish(channel, {
        [fieldName]: data[fieldName].node
    });
};

interface RunOptions {
    node?: {}
    moduleToRun?: Function
    context?: any
}

/**
 * Run a module.
 */
export const run = async (channel: string, mutation: string, options: RunOptions) => {
    const {
        node,
        moduleToRun,
        context
    } = options;

    if (!moduleToRun) {
        coreLogger.silly('Tried to run but has no "moduleToRun"');
        return publish(channel, mutation, node);
    }

    try {
        // Run module
        const result: CoreResult = await new Promise(resolve => {
            debugTimer(`run:${moduleToRun.name}`);
            return resolve(moduleToRun(context));
        });

        // Log result
        coreLogger.silly(`run:${moduleToRun.name}`, JSON.stringify(result.json, null, 2));

        // Save result
        publish(channel, mutation, result.json);
    } catch (error) {
        // Ensure we aren't leaking anything in production
        if (process.env.NODE_ENV === 'production') {
            coreLogger.debug('Error:', error.message);
        } else {
            const logger = coreLogger[error.status && error.status >= 400 ? 'error' : 'warn'].bind(coreLogger);
            logger('Error:', error.message);
        }
    }

    debugTimer(`run:${moduleToRun.name}`);
};

