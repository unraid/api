import { randomBytes } from 'crypto';
import NodeCache from 'node-cache';
import { logger } from '../core';
import { varState } from '../core/states/var';
import { myServersConfig } from '../core/watchers/myservers';
import { compareUnraidVersion } from './unraid-version-compare';

/**
 * Generate two factor token.
 */
export const generateTwoFactorToken = () => randomBytes(64).toString('hex');

/**
 * Valid 2FA tokens.
 */
export const twoFactorTokens = new NodeCache({
	deleteOnExpire: true,
	stdTTL: 5 * 60 * 1_000 // Allow 5m of cache time
});

/**
 * Verify 2FA token.
 *
 * If the token is missing, too short, too long or invalid an error will be thrown.
 */
export const verifyTwoFactorToken = (username: string, token?: string) => {
	// Bail if token is missing
	if (!token) throw new Error('Missing token!');

	// Bail if token is too short or long
	if (token.length !== 128) throw new Error('Invalid token length!');

	// Get the current token for this user
	const existingToken = twoFactorTokens.get(username);

	// Bail if we've never generated a token or if the token expired
	if (!existingToken) throw new Error('No valid token for this user!');

	// Check token is valid
	const valid = existingToken === token;

	// Bail if token is invalid
	if (!valid) throw new Error('Invalid token!');

	// Delete old token
	twoFactorTokens.del(token);

	// Generate new token
	twoFactorTokens.set(username, generateTwoFactorToken());
};

export const setTwoFactorToken = (username: string, token: string) => {
	twoFactorTokens.set(username, token);
};

export const checkTwoFactorEnabled = () => {
	// Check if 2fa is enabled
	const isHighEnoughVersion = compareUnraidVersion('>=6.10');
	const isSSLAuto = varState.data.useSsl === null; // In this case `null` is the same as auto
	const isRemoteEnabled = myServersConfig.remote?.['2Fa'] === 'yes';
	const isLocalEnabled = myServersConfig.local?.['2Fa'] === 'yes';
	const isEnabled = isHighEnoughVersion && isSSLAuto && (isRemoteEnabled || isLocalEnabled);

	logger.debug('Checking 2FA status', {
		isHighEnoughVersion,
		isSSLAuto,
		isRemoteEnabled,
		isLocalEnabled,
		isEnabled
	});

	return {
		isHighEnoughVersion,
		isSSLAuto,
		isRemoteEnabled,
		isLocalEnabled,
		isEnabled
	};
};
