import { getters } from '@app/store';
import type { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { CacheKeys, type DNSCheck } from '@app/store/types';

export const getCloudCache = (): Cloud['cloud'] | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkCloud);
};

export const getDnsCache = (): DNSCheck | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkDns);
};
