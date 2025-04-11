import { getters } from '@app/store/index.js';
import { ArrayState } from '@app/unraid-api/graph/resolvers/array/array.model.js';

/**
 * Is the array running?
 */
export const arrayIsRunning = () => {
    const emhttp = getters.emhttp();
    return emhttp.var.mdState === ArrayState.STARTED;
};
