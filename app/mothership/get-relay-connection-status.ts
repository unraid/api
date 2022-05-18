import { store } from './store';

export const readyStates = ['CONNECTING' as const, 'OPEN' as const, 'CLOSING' as const, 'CLOSED' as const, 'RECONNECTING' as const];
export const getRelayConnectionStatus = () => readyStates[store.relay?._ws?.readyState ?? 3];
export const getRelayReconnectingTimeout = () => store.timeout ? (store.timeout - Date.now()) : 0;
export const getRelayDisconnectionReason = () => store.reason;
