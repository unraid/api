import { getters } from '@app/store';
import { CacheKeys, type DNSCheck } from '@app/store/types';
import { type CloudResponse } from '../../graphql/generated/api/types';

export const getCloudCache = (): CloudResponse | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkCloud);
};

export const getDnsCache = (): DNSCheck | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkDns);
};
