import { RootState } from '@app/store';

export enum FileLoadStatus {
	UNLOADED = 'UNLOADED',
	LOADING = 'LOADING',
	LOADED = 'LOADED',
}

export enum MemoryCacheStatus {
	UNCACHED = 'UNCACHED',
	CACHED = 'CACHED',
}

export type StoreSubscriptionHandler = (lastState: RootState | null) => Promise<void>;
