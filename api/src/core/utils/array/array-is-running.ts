import { ArrayState } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

/**
 * Is the array running?
 */
export const arrayIsRunning = () => {
    const emhttp = getters.emhttp();
    return emhttp.var.mdState === ArrayState.STARTED;
};
