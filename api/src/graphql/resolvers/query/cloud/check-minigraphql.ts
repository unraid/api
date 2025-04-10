import { logger } from '@app/core/log.js';
import { getters } from '@app/store/index.js';
import { MinigraphqlResponse } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

export const checkMinigraphql = (): MinigraphqlResponse => {
    logger.trace('Cloud endpoint: Checking mini-graphql');
    // Do we have a connection to mothership?
    const { status, error, timeout, timeoutStart } = getters.minigraph();

    const timeoutRemaining = timeout && timeoutStart ? timeout - (Date.now() - timeoutStart) : null;

    return { status, error, timeout: timeoutRemaining };
};
