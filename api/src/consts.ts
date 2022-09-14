
import { config } from '@app/core/config';

const internalWsAddress = () => {
	const port = config.port as number | string;
	return isNaN(port as any)
		// Unix Socket
		? `ws+unix:${port}`
		// Numbered port
		: `ws://localhost:${port}`;
};

/**
 * One second in milliseconds.
 */
export const ONE_SECOND = 1_000;

/**
 * One minute in milliseconds.
*/
export const ONE_MINUTE = 60 * ONE_SECOND;

/**
 * One hour in milliseconds.
*/
export const ONE_HOUR = 60 * ONE_MINUTE;

/**
 * Relay ws link.
 */
export const MOTHERSHIP_RELAY_WS_LINK = process.env.MOTHERSHIP_RELAY_WS_LINK ?? (process.env.ENVIRONMENT === 'staging' ? 'wss://staging.mothership.unraid.net/relay' : 'wss://mothership.unraid.net/relay');

/**
 * Graphql link.
 */
export const MOTHERSHIP_GRAPHQL_LINK = process.env.MOTHERSHIP_GRAPHQL_LINK ?? (process.env.ENVIRONMENT === 'staging' ? 'https://staging.mothership.unraid.net/graphql' : 'https://mothership.unraid.net/graphql');

/**
 * Internal ws link.
 */
export const INTERNAL_WS_LINK = process.env.INTERNAL_WS_LINK ?? internalWsAddress();
