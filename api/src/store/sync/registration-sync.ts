import { pubsub } from '@app/core/pubsub';
import { RootState, store } from '@app/store';
import { StoreSubscriptionHandler } from '@app/store/types';
import isEqual from 'lodash/isEqual';

const createRegistrationEvent = (state: RootState) => ({
	guid: state.emhttp.var.regGuid,
	type: state.emhttp.var.regTy.toUpperCase(),
	state: state.emhttp.var.regState,
	keyFile: {
		location: state.emhttp.var.regFile,
		contents: state.registration.keyFile,
	},
});

export const syncRegistration: StoreSubscriptionHandler = async _lastState => {
	const lastState = createRegistrationEvent(_lastState as unknown as RootState);
	const currentState = createRegistrationEvent(store.getState());

	// Skip this even if it's the same as the last one
	if (isEqual(lastState, currentState)) return;

	// Publish to graphql
	await pubsub.publish('registration', { registration: currentState });
};
