import { getters } from '@app/store';
import type { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { CacheKeys } from '@app/types/cache-keys';

export const getCloudCache = (): Cloud['cloud'] | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkCloud);
};
