import { relayStore } from '@app/mothership/store';

export const readyStates = ['CONNECTING' as const, 'OPEN' as const, 'CLOSING' as const, 'CLOSED' as const, 'RECONNECTING' as const];
export const getRelayConnectionStatus = () => readyStates[relayStore.relay?._ws?.readyState ?? 3];
export const getRelayReconnectingTimeout = () => relayStore.timeout ? (relayStore.timeout - Date.now()) : null;
export const getRelayDisconnectionReason = () => relayStore.reason ?? null;
export const getRelayDisconnectionCode = () => relayStore.code;
