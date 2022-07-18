import type WebSocketAsPromised from 'websocket-as-promised';

export const relayStore: {
	relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
	timeout: number | undefined;
	reason: string | undefined;
	code: number | undefined;
} = {
	relay: undefined,
	timeout: undefined,
	reason: undefined,
	code: undefined,
};

export const miniGraphqlStore: {
	connected: boolean;
} = {
	connected: false,
};
