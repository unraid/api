import prettyMilliseconds from 'pretty-ms';
import { store } from '../mothership/store';

export type RelayStates = 'connecting' | 'open' | 'closing' | 'closed' | 'unknown';

export const relayStateToHuman = (relayState?: RelayStates, timeout = store.timeout) => {
	switch (relayState) {
		case 'closing':
			return 'disconnecting';
		case 'closed':
			return 'disconnected';
		case 'open':
			return 'connected';
		default:
			return relayState ?? 'disconnected';
	}
};
