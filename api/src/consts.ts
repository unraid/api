import { PORT } from '@app/environment';
import { type JSONWebKeySet } from 'jose';

export const getInternalApiAddress = (isHttp = true, nginxPort = 80) => {
    const envPort = PORT;
    const protocol = isHttp ? 'http' : 'ws';

    if (!envPort.toString().includes('.sock')) {
        // Dev Mode (Probably)
        return `${protocol}://127.0.0.1:${envPort}/graphql`;
    }

    if (nginxPort && nginxPort !== 80) {
        // User changed webgui port
        return `${protocol}://127.0.0.1:${nginxPort}/graphql`;
    }

    // Prod mode (user didn't change webgui port)
    return `${protocol}://127.0.0.1/graphql`;

};

// Milliseconds
export const ONE_SECOND = 1_000;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const ONE_HOUR = 60 * ONE_MINUTE;

export const ONE_SECOND_MS = 1_000;
export const THIRTY_SECONDS_MS = ONE_SECOND_MS * 30;
export const ONE_MINUTE_MS = 60 * ONE_SECOND;
export const TWO_MINUTES_MS = 2 * ONE_MINUTE_MS;
export const THREE_MINUTES_MS = 3 * ONE_MINUTE_MS;
export const FIVE_MINUTES_MS = 5 * ONE_MINUTE;
export const TEN_MINUTES_MS = 10 * ONE_MINUTE;
export const THIRTY_MINUTES_MS = 30 * ONE_MINUTE;
export const ONE_HOUR_MS = 60 * ONE_MINUTE;

// Seconds
export const ONE_HOUR_SECS = 60 * 60;
export const ONE_DAY_SECS = ONE_HOUR_SECS * 24;
export const FIVE_DAYS_SECS = ONE_DAY_SECS * 5;

export const KEEP_ALIVE_INTERVAL_MS = THREE_MINUTES_MS; // This is set to 45 seconds on mothership, servers will use a 1 minute margin to ensure it has some wiggle room

/**
 * Graphql link.
 */
export const MOTHERSHIP_GRAPHQL_LINK =
    process.env.MOTHERSHIP_GRAPHQL_LINK ??
    (process.env.ENVIRONMENT === 'staging'
        ? 'https://staging.mothership.unraid.net/ws'
        : 'https://mothership.unraid.net/ws');

export const JWKS_LOCAL_PAYLOAD: JSONWebKeySet = {
    keys: [
        {
            alg: 'RS256',
            e: 'AQAB',
            kid: 'gaIMLlq2G8uduhiG/UCQMF/e8NfEarZTVBXJNhtTc8w=',
            kty: 'RSA',
            n: 'lJLfJsKBVCDSfMXp45tVYDFkjEEwSJabSsnMokmk3Hb6SPMz4i-n7Y1Iu_30AGQekQSUTcYT6Ps8V0hnFsqKb45YAWVu4E40OEgBrOZ4F8l8-M-1QbkyLFPWWyHtqhrsbXoocyfTGL82GSjXfg2ro7oeOC9hzx9kTqxPNHjW6-BEwILGYm8kja9FAP3-5Kel4TJjcq5yKzGqnTiepOMc-t9sqhxU8Xn8fxAkF7uLGtJIG_q5THm1uaweBFev4A0uoxz1o4x0s9ziuNqLh7ZjNwdLFlN4NjwS_UExKzzsu_ETzyED3Epz7IMm28-B8QQKW3AnD10EeecHUqCEgOWkdQ',
            use: 'sig',
        },
        {
            alg: 'RS256',
            e: 'AQAB',
            kid: '7P5khdMzsRk5umjmK5EinnrerHumYEIb/zxjgP1Psuk=',
            kty: 'RSA',
            n: '5XwHdLwj5TxpDdbQ2gNRIqWw-lSLw4KDdLZcjlVe4CB6BOSwraWXrdSvGO0YftSARF-msHP-Hbjx67nd_O1pfO2ReBpbKCJVXZPaDXVNrQfu4ROXrDCo6VauGzkbPIEmXhN6gNN_0qx30mWgopq-xLnZI_wbY2Al1pW1AFNxr4KiNo0DHiFfCSEr7omj8lyl-zQ3VVBBhyFjdu-trUbbmoEn3BqsvCBMpx11dpmoBWwmEjbumOSwstP2ltSxDErdOsA8RUn6CSyDsK1E396lG7rz8cAmQepgYkEkwvhmHXEz22iqnNWgXLuMDhE_UCGWYU0lvsrEifSkFfaIPoEGsQ',
            use: 'sig',
        },
    ],
};
export const OAUTH_BASE_URL =
    'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_btSkhlsEk';
export const OAUTH_CLIENT_ID = '53ci4o48gac8vq5jepubkjmo36';
export const OAUTH_OPENID_CONFIGURATION_URL =
    OAUTH_BASE_URL + '/.well-known/openid-configuration';
export const JWKS_REMOTE_LINK = OAUTH_BASE_URL + '/.well-known/jwks.json';
export const RCD_SCRIPT = 'rc.unraid-api';
export const KEYSERVER_VALIDATION_ENDPOINT =
    'https://keys.lime-technology.com/validate/apikey';

/** Set the max retries for the GraphQL Client */
export const MAX_RETRIES_FOR_LINEAR_BACKOFF = 100;
