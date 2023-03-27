import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts';
import { cliLogger } from '@app/core';
import { createLocalJWKSet, createRemoteJWKSet, decodeJwt, type JWTPayload, jwtVerify } from 'jose';
import { setEnv } from '@app/cli/set-env';
import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';

const JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
const JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));

const createJsonErrorString = (errorMessage: string) => JSON.stringify({
	error: errorMessage,
	valid: false,
});

export const validateToken = async (...argv: string[]): Promise<void> => {
	// @TODO Please add ability to read the users ID from myservers.cfg
	// and positively match them to determine whether token is valid for that user
	setEnv('LOG_TYPE', 'raw');

	if (argv.length === 1) {
		cliLogger.info('Usage: "unraid-api validate-token YOUR_TOKEN"');
		cliLogger.info('Returns JSON: { error: string | null, valid: boolean }');
		return;
	}

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
		if (caughtError instanceof Error) {
			cliLogger.error(createJsonErrorString(`Caught error validating jwt token: ${caughtError.message}`));
		} else {
			cliLogger.error(createJsonErrorString('Caught error validating jwt token'));
		}

		return;
	}

	if (tokenPayload === null) {
		cliLogger.error(createJsonErrorString('No data in JWT to use for user validation'));
		return;
	}

	const username = tokenPayload.username ?? tokenPayload['cognito:username'];
	const configFile = await store.dispatch(loadConfigFile()).unwrap();
	if (!configFile.remote?.accesstoken) {
		cliLogger.error(createJsonErrorString('No local user token set to compare to'));
		return;
	}

	const existingUserPayload = decodeJwt(configFile.remote?.accesstoken);
	if (username === existingUserPayload.username) {
		cliLogger.info(JSON.stringify({ error: null, valid: true }));
	} else {
		cliLogger.error(createJsonErrorString('Username on token does not match logged in user name'));
	}
};
