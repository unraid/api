import { config } from '@unraid/core';

const internalWsAddress = () => {
	const port = config.get('port');
	return isNaN(port as any)
		// Unix Socket
		? `ws+unix:${port}`
		// Numbered port
		: `ws://localhost:${port}`;
}

/**
 * One second in milliseconds.
 */
export const ONE_SECOND = 1000;

/**
 * One minute in milliseconds.
*/
export const ONE_MINUTE = 60 * ONE_SECOND;

/**
 * Relay ws link.
 */
export const MOTHERSHIP_RELAY_WS_LINK = process.env.MOTHERSHIP_RELAY_WS_LINK ? process.env.MOTHERSHIP_RELAY_WS_LINK : 'wss://mothership.unraid.net/relay';

/**
 * Graphql link.
 */
export const MOTHERSHIP_GRAPHQL_LINK = process.env.MOTHERSHIP_GRAPHQL_LINK ? process.env.MOTHERSHIP_GRAPHQL_LINK : 'https://mothership.unraid.net/graphql';

/**
 * Internal ws link.
 */
export const INTERNAL_WS_LINK = process.env.INTERNAL_WS_LINK ? process.env.INTERNAL_WS_LINK : internalWsAddress();
