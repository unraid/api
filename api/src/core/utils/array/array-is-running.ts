import { ArrayState } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

/**
 * Is the array running?
 */
export const arrayIsRunning = () => {
    const emhttp = getters.emhttp();
    return emhttp.var.mdState === ArrayState.STARTED;
};
