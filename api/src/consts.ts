
import { config } from '@app/core/config';
import { JSONWebKeySet } from 'jose';

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

export const JWKS_LOCAL_PAYLOAD: JSONWebKeySet = {
	keys: [
		{
			alg: 'RS256',
			e: 'AQAB',
			kid: 'FLRVTZxoIwGvmBvvY3IJkpHvSeSA5RHonEAZwmzBQXo=',
			kty: 'RSA',
			n: 'vPISS-MkghS0enVU99BjM1IoSucWWHZAArmZOBYrOTR46QtBrzBI3B2Skk5BfgmDhM_q70LUZAtPsFwd3qFuw4B7SCjgEVOuwWhN4D2lkwxfUVAzFbPr78S8aSr1LFO-Q2wbHMapN3_8YkuZf-oa8J42LNF6lxrDCXvLiAgSsr9HawH3fMXO-nX3bxdEnVqVX7IueLeClAPKaPiKswPeI1hiMWcIaD0sJdU9KRMeO3jvctelM9VbpIPxkyvrpjOo8qnv7VTqeOmSBTCeaOZFInx2Nxp0rCwxO4s9KJNMLl1EWxHSIRT2gLIdOAICb2X6lSQwwvJo2tJ1xQ8vwtbfMQ',
			use: 'sig',
		},
		{
			alg: 'RS256',
			e: 'AQAB',
			kid: 'ys+gjD8xNvkF64OR8k4CPTMkOK6T2okPxkjzgnbwHjQ=',
			kty: 'RSA',
			n: 'tpv0Mz0osFgmBd8ALS-LYAvqDJXKckESgzUmYcsGpLn5vn-AhPXnwHY75IoTDt4wu0Hzt26--71YpAnwc2H553wdx-Vxn8Da90O43ihEmJqW73W-8QWpmVb69mF4PoraPefe741_Zafapb6893Vw7Nc16PW4qMxNifQiKk9CBOrahf9kzwyTfbF53a9jUAMQEZAIGRBhXzpbJXysSlPHUKExUGsNBEwcGetSeRQGDqfuDN38fZj5MvieG_AJwrSdesJY9JMQ7PHFdWaCpcYsujlyVQ3pkRA78x8HHbNxYsBUTzofDPojOWelRvZnyaMj2S_RUOd2zckUO84VO4xEgQ',
			use: 'sig',
		},
	],
};

export const JWKS_REMOTE_LINK = 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_cEornDvBp/.well-known/jwks.json';
