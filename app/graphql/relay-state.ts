export type RelayStates = 'connecting' | 'open' | 'closing' | 'closed' | 'unknown';

export const relayStateToHuman = (relayState?: RelayStates) => {
	switch (relayState) {
		case 'closing':
			return 'disconnecting';
		case 'closed':
			return 'disconnected';
		case 'open':
			return 'connected';
		default:
			return relayState ?? 'unknown';
	}
};
