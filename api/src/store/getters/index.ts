import { getters, store } from '@app/store';
import { CacheKeys, type DNSCheck } from '@app/store/types';
import { type CloudResponse } from '@app/graphql/generated/api/types';

export const getCloudCache = (): CloudResponse | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkCloud);
};

export const getDnsCache = (): DNSCheck | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkDns);
};

export const hasRemoteSubscription = (sha256: string, state = store.getState()): boolean => {
	return state.remoteGraphQL.subscriptions.some(sub => sub.sha256 === sha256);
}