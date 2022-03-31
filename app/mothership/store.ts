import type WebSocketAsPromised from 'websocket-as-promised';

export const store: {
	relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
	timeout: number | undefined;
	reason: string | undefined;
} = {
	relay: undefined,
	timeout: undefined,
	reason: undefined
};
