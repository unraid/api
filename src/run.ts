import { CoreResult } from '@unraid/core/dist/interfaces';
import * as core from '@unraid/core'
import { canPublishToChannel } from './ws';

const { pubsub, utils, log } = core;
const { debugTimer } = utils;

/**
 * Update pubsub.
 */
export const updatePubsub = (channel, mutation, node) => {
    if (!canPublishToChannel(channel)) {
        return;
    }

    pubsub.publish(channel, {
        [channel]: {
            mutation,
            node
        }
    });
};

interface RunOptions {
    node?: string
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

    if (!canPublishToChannel(channel)) {
        return;
    }

    if (!moduleToRun) {
        return updatePubsub(channel, mutation, node);
    }

    try {
        // Run module
        const result: CoreResult = await new Promise(resolve => {
            debugTimer(`run:${moduleToRun.name}`);
            return resolve(moduleToRun(context));
        });

        log.debug('Module:', moduleToRun.name, 'Result:', result.json);

        // Update pubsub channel
        updatePubsub(channel, mutation, result.json);
    } catch (error) {
        // Ensure we aren't leaking anything in production
        if (process.env.NODE_ENV === 'production') {
            log.debug('Error:', error.message);
        } else {
            const logger = log[error.status && error.status >= 400 ? 'error' : 'warn'];
            logger('Error:', error.message);
        }
    }

    debugTimer(`run:${moduleToRun.name}`);
};
