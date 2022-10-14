import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts';
import { cliLogger } from '@app/core';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';

const JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
const JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));

export const validateToken = async (...argv: string[]): Promise<boolean> => {
	if (argv.length > 1) {
		return false;
	}

	const token = argv[0];

	let caughtError: null | unknown = null;
	try {
		cliLogger.trace('Attempting to validate token with local key');
		await jwtVerify(token, JWKSOffline);
	} catch (error: unknown) {
		try {
			cliLogger.trace('Local validation failed for key, trying remote validation');
			await jwtVerify(token, JWKSOnline);
		} catch (error: unknown) {
			caughtError = error;
		}
	}

	if (caughtError) {
		cliLogger.error('Caught error validating jwt token', caughtError);
		return false;
	}

	return true;
};
