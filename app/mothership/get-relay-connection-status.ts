import { getRelay } from './index';

export const readyStates = ['CONNECTING' as const, 'OPEN' as const, 'CLOSING' as const, 'CLOSED' as const];
export const getRelayConnectionStatus = () => readyStates[getRelay()?._ws?.readyState ?? 3];
