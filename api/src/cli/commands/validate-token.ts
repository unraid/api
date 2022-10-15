import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts';
import { cliLogger } from '@app/core';
import { createLocalJWKSet, createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';
import { setEnv } from '@app/cli/set-env';

const JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
const JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));

export const validateToken = async (...argv: string[]): Promise<void> => {
	// @TODO Please add ability to read the users ID from myservers.cfg
	// and positively match them to determine whether token is valid for that user
	setEnv('LOG_TYPE', 'raw');

	if (argv.length > 2) {
		cliLogger.error('Too many args, please pass just the token');
		return;
	}

	const token = argv[1];

	let caughtError: null | unknown = null;
	let tokenPayload: null | JWTPayload = null;
	try {
		cliLogger.trace('Attempting to validate token with local key');
		tokenPayload = (await jwtVerify(token, JWKSOffline)).payload;
	} catch (error: unknown) {
		try {
			cliLogger.trace('Local validation failed for key, trying remote validation');
			tokenPayload = (await jwtVerify(token, JWKSOnline)).payload;
		} catch (error: unknown) {
			caughtError = error;
		}
	}

	if (caughtError) {
		cliLogger.error('Caught error validating jwt token', caughtError);
	}

	cliLogger.info('%o', tokenPayload);
};
