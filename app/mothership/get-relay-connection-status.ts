import { store } from './store';

export const readyStates = ['CONNECTING' as const, 'OPEN' as const, 'CLOSING' as const, 'CLOSED' as const];
export const getRelayConnectionStatus = () => readyStates[store.relay?._ws?.readyState ?? 3];
