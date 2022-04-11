import prettyMilliseconds from 'pretty-ms';
import { store } from '../mothership/store';

export type RelayStates = 'connecting' | 'open' | 'closing' | 'closed' | 'unknown';

export const relayStateToHuman = (relayState?: RelayStates, timeout = store.timeout) => {
	switch (relayState) {
		case 'closing':
			return 'disconnecting';
		case 'closed':
			if (timeout !== undefined) return `reconnecting in ${timeout >= 1 ? prettyMilliseconds(timeout) : 'a few seconds'}`;
			return 'disconnected';
		case 'open':
			return 'connected';
		default:
			return relayState ?? 'disconnected';
	}
};
