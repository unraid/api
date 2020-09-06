import { CoreResult } from '@unraid/core/dist/lib/types';
import { pubsub, utils, log } from '@unraid/core';
import { canPublishToChannel } from './ws';

const { debugTimer } = utils;

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

    if (!canPublishToChannel(channel)) {
        // console.log(`can't post to ${channel}`);
        return;
    }

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
        return publish(channel, mutation, node);
    }

    try {
        // Run module
        const result: CoreResult = await new Promise(resolve => {
            debugTimer(`run:${moduleToRun.name}`);
            return resolve(moduleToRun(context));
        });

        log.debug('Module:', moduleToRun.name, 'Result:', result.json);

        // Save result
        publish(channel, mutation, result.json);
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

