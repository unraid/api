import type { DNSCheck } from '@app/store/types.js';
import { getters, store } from '@app/store/index.js';
import { CacheKeys } from '@app/store/types.js';
import { type CloudResponse } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

export const getCloudCache = (): CloudResponse | undefined => {
    const { nodeCache } = getters.cache();
    return nodeCache.get(CacheKeys.checkCloud);
};

export const getDnsCache = (): DNSCheck | undefined => {
    const { nodeCache } = getters.cache();
    return nodeCache.get(CacheKeys.checkDns);
};

// export const hasRemoteSubscription = (sha256: string, state = store.getState()): boolean => {
//     return state.remoteGraphQL.subscriptions.some((sub) => sub.sha256 === sha256);
// };
