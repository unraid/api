import prettyMilliseconds from 'pretty-ms';
import { store } from '../mothership/store';

export type RelayStates = 'connecting' | 'open' | 'closing' | 'closed' | 'unknown';

export const relayStateToHuman = (relayState?: RelayStates) => {
	switch (relayState) {
		case 'closing':
			return 'disconnecting';
		case 'closed':
			if (store.timeout !== undefined) return `reconnecting in ${store.timeout >= 1 ? prettyMilliseconds(store.timeout) : 'a few seconds'}`;
			return 'disconnected';
		case 'open':
			return 'connected';
		default:
			return relayState ?? 'API is offline';
	}
};
