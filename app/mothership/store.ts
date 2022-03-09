import type WebSocketAsPromised from 'websocket-as-promised';

export const store: {
	relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
	timeout: number | undefined;
} = {
	relay: undefined,
	timeout: undefined
};
