import { FileLoadStatus } from '@app/store/types.js';

/**
 * Unraid version string.
 * @returns The current version.
 */
export const getUnraidVersion = async (): Promise<string> => {
    const { getters } = await import('@app/store/index.js');
    const { status, var: emhttpVar } = getters.emhttp();
    if (status === FileLoadStatus.LOADED) {
        return emhttpVar.version;
    }

    return 'unknown';
};
