import { logger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { store } from '@app/store';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import isEqual from 'lodash/isEqual';

type RegistrationEvent = {
	registration: {
		guid: string;
		type: string;
		state: string;
		keyFile: {
			location: string;
			contents: null;
		};
	};
};

const createRegistrationEvent = (state: Parameters<StoreSubscriptionHandler>[0]): RegistrationEvent | null => {
	// Var state isn't loaded
	if (state === null || Object.keys(state.emhttp.var).length === 0) return null;

	const event = {
		registration: {
			guid: state.emhttp.var.regGuid,
			type: state.emhttp.var.regTy.toUpperCase(),
			state: state.emhttp.var.regState,
			keyFile: {
				location: state.emhttp.var.regFile,
				contents: state.registration.keyFile,
			},
		},
	};

	return event;
};

export const syncRegistration: StoreSubscriptionHandler = async lastState => {
	try {
		// Skip until we have the key and emhttp states loaded
		const { registration, emhttp } = store.getState();
		if (registration.status !== FileLoadStatus.LOADED) return;
		if (emhttp.status !== FileLoadStatus.LOADED) return;

		const lastEvent = createRegistrationEvent(lastState);
		const currentEvent = createRegistrationEvent(store.getState());

		// Skip if either event resolved to null
		if (lastEvent === null || currentEvent === null) return;

		// Skip this if it's the same as the last one
		if (isEqual(lastEvent, currentEvent)) return;

		logger.debug('Registration was updated, publishing event');

		// Publish to graphql
		await pubsub.publish('registration', currentEvent);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Failed publishing registration event with unknown error "${String(error)}"`);
		logger.error('Failed publishing registration event with "%s"', error.message);
	}
};
