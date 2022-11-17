
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

export const JWKS_LOCAL_PAYLOAD: JSONWebKeySet = { keys: [{ alg: 'RS256', e: 'AQAB', kid: '14KUZS5NIWJLeyiqG++DMroQ/jt8nikSYjxEkfpkYXc=', kty: 'RSA', n: 'wioXjPPBb69jssYgb4CjgM1VahwNfSBFFwfSjh8e--EU3z_EAqBXDcbkfiwa-UZZEgcSGRlKMGi4R08e-TjXkHtGbdl1ecn6tTAp4d5RLfM5jOKHogMA7_VM_nOZIvZPNAjPDIbWDzNqCLz5-7jB9iDKc0BRiu6f8yfaxnwIIBBJ51DCj0FlBA5jM41rfZx65BAWEVDw_cqMPZvnuA99D_HwGQR8PllEHA35DH9Val-MxQg0XNIniJbfaL_lTTRnhaPuopIVm18ZfRcxYgJ-kfqNevOT0v6ADvxAUxyr8yEPdaB9nwVqjXTc007oyHwlwVKmleuhUm0UWSd1zNX1mw', use: 'sig' }, { alg: 'RS256', e: 'AQAB', kid: 'oeN5CSZ3yy6IlWP9kg6lTmo47gOn+XdOjw1qOpT3dBY=', kty: 'RSA', n: 'vsS6dMbg5hjz1_bLq0ChWQnPAAmm5TPg81L8eYgeFHK0jNstp0Bx8EQpYthiYx9PxK426uYCzWhJPC--XggQjFiGOVqdaF0diz76oso7QLvk965P92Y869YmkO3RYxl8mVWfloaYyQqznS8D6ILkFfgPCiqK5Rk7vov57HY6ir6n2T4F2-FUmasLQx5-EHcnUU2AYH5RttmHRrdkeiDyVOZOKG-3EPkHx7eXlGoOHYOccqlT1T_5LOJmVx_mqa2z_j1ZlTS_dSlE9LGz84qd45BMDMbvuiqehq-wSOnvE1ZAVI6bA_tuIfVPGws9A1ISwL1hlDesxNNkCGfNHZyZdQ', use: 'sig' }] };
export const OAUTH_BASE_URL = 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_wNWfJnDr8';
export const OAUTH_CLIENT_ID = '6j48osc811hgbn4nqkhge3su5q';
export const OAUTH_OPENID_CONFIGURATION_URL = OAUTH_BASE_URL + '/.well-known/openid-configuration';
export const JWKS_REMOTE_LINK = OAUTH_BASE_URL + '/.well-known/jwks.json';
export const UNRAID_API_BIN = '/usr/local/bin/unraid-api/unraid-api';
