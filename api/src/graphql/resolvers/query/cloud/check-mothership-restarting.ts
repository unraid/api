import { getRelayDisconnectionCode } from '@app/mothership/get-relay-connection-status';

export const checkMothershipRestarting = (): void => {
	// Check if we got a 1012 which means mothership is restarting
	if (getRelayDisconnectionCode() === 12) throw new Error('Mothership is restarting');
};
