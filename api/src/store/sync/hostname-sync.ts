import { logger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { type RootState, store } from '@app/store';
import { FileLoadStatus, type StoreSubscriptionHandler } from '@app/store/types';
import isEqual from 'lodash/isEqual';

type HostnameEvent = {
	info: {
		os: {
			hostname: string;
		};
	};
};

export const createHostnameEvent = (state: RootState | null): HostnameEvent | null => {
	// Var state isn't loaded
	if (state === null || Object.keys(state.emhttp.var).length === 0) return null;

	const hostname = state.emhttp.var.name;

	return {
		info: {
			os: {
				hostname,
			},
		},
	};
};

export const syncHostname: StoreSubscriptionHandler = async lastState => {
	try {
		// Skip until we have emhttp states loaded
		const { emhttp } = store.getState();
		if (emhttp.status !== FileLoadStatus.LOADED) return;

		const lastEvent = createHostnameEvent(lastState);
		const currentEvent = createHostnameEvent(store.getState());

		// Skip if either event resolved to null
		if (lastEvent === null || currentEvent === null) return;

		// Skip this if it's the same as the last one
		if (isEqual(lastEvent, currentEvent)) return;

		logger.debug('Hostname was updated, publishing event');

		// Publish to graphql
		await pubsub.publish('info', currentEvent);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Failed publishing array event with unknown error "${String(error)}"`);
		logger.error('Failed publishing array event with "%s"', error.message);
	}
};
