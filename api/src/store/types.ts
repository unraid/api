import { RootState } from '@app/store';

export enum FileLoadStatus {
	UNLOADED = 'UNLOADED',
	LOADING = 'LOADING',
	LOADED = 'LOADED',
	FAILED_LOADING = 'FAILED_LOADING',
}

export enum MemoryCacheStatus {
	UNCACHED = 'UNCACHED',
	CACHED = 'CACHED',
}

export type StoreSubscriptionHandler = (lastState: RootState | null) => Promise<void>;

export enum CacheKeys {
	checkCloud = 'check-cloud',
	checkDns = 'check-dns',
}

export type DNSCheck = {
	cloudIp: string;
	error: null;
} | { error: Error; cloudIp: null };
