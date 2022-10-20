
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

export const JWKS_LOCAL_PAYLOAD: JSONWebKeySet = { keys: [{ alg: 'RS256', e: 'AQAB', kid: 'aydGiPatWzE0Sodf902wHCCXO22KQ7SssEI48h/ZOCY=', kty: 'RSA', n: 'yF736UeAde5-6-5EaTpc-H6rKbAVuGwr2Q5askRz2rtxHV4a_tt7bxuJEO7gB3z6ZOQmWrkEd0T4245hHp5zLHIAuAdMVFWEYGSbW4TNPUAlAje5IvIkiZSVeChEJUe51niXpi7PWxNdVWuiKBA_8wP2Bk3x5nAwtWZuUkGrHWWwv9A9atJdSSPwyXIJKyu9c3BUNyLmj6STOpcJfeHe3TVNsGDK8l2X-c8XHCW1oFu_xgQUNhV0_PUKWYF0JXA0aDXPM60ChAm-01YQOkcuakkh5JHIjHWiDUci0R8p7m5yNyJZWijQrXQzAjbzBlxfmHDe4qA6af093xedlEnc8Q', use: 'sig' }, { alg: 'RS256', e: 'AQAB', kid: 'nnH7RP3X49vVZJo0FUCJKN/GX4/WyVolryA5yUlbYac=', kty: 'RSA', n: 'yJxB-hMXlhm8qp2U1cQMI4A15mqVt6e-IMldCJtZW-LA4LquaysxW5-w0N2-v4RJsIHJquFWih5G7OyrSajH537n6f_QyaiRjSxOAx5A7m-kOSimc7LPZl4HOh5pVLqBiTfMBYJO2dww05bvdBrwr0wE0ts_gxAl8kNX3jRbl7PYOqT_oKurlGtJGOtI83gkybjGBsTS2vZg3u_UfAwsoonUqSz0jmApRTN5_ZwTeebFSouOGnIfaAIdt4KPBXpbgm4LBfRivUfMG7_jkqO4pLGOUep9zUVJZmHA3jZY5LkiKzsOTN-w0liiP0VgWJk7DyqNLBBU8KaV24ZjicYeBQ', use: 'sig' }] };
export const OAUTH_BASE_URL = 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_b9sQxHH4x';
export const OAUTH_CLIENT_ID = '3moho4uk3s1ieimi53j4fl5ruv';
export const OAUTH_OPENID_CONFIGURATION_URL = OAUTH_BASE_URL + '/.well-known/openid-configuration';
export const JWKS_REMOTE_LINK = OAUTH_BASE_URL + '/.well-known/jwks.json';
