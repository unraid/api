import { getters, store } from '@app/store';
import { CacheKeys, type DNSCheck } from '@app/store/types';
import { type CloudResponse } from '@app/graphql/generated/api/types';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';

export const getCloudCache = (): CloudResponse | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkCloud);
};

export const getDnsCache = (): DNSCheck | undefined => {
	const { nodeCache } = getters.cache();
	return nodeCache.get(CacheKeys.checkDns);
};

export const isApiKeyValid = (state = store.getState()): boolean => {
	const { status } = state.apiKey;
	return status === API_KEY_STATUS.API_KEY_VALID;
};

export const isApiKeyLoading = (state = store.getState()): boolean => {
	const { status } = state.apiKey;
	return status === API_KEY_STATUS.PENDING_VALIDATION;
};
