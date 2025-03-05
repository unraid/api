import { getters } from '@app/store/index.js';

export const checkMinigraphql = (): MinigraphqlResponse => {
    logger.trace('Cloud endpoint: Checking mini-graphql');
    // Do we have a connection to mothership?
    const { status, error, timeout, timeoutStart } = getters.minigraph();

    const timeoutRemaining = timeout && timeoutStart ? timeout - (Date.now() - timeoutStart) : null;

    return { status, error, timeout: timeoutRemaining };
};
