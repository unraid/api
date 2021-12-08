import { randomBytes } from 'crypto';

/**
 * Generate two factor token.
 */
export const generateTwoFactorToken = () => randomBytes(64).toString('hex');

/**
 * Valid 2FA tokens.
 */
export const twoFactorTokens = new Map([
	['root', generateTwoFactorToken()]
]);

/**
 * Verify 2FA token.
 *
 * If the token is missing, too short, too long or invalid an error will be thrown.
 */
export const verifyTwoFactorToken = (token: string) => {
	// Bail if token is missing
	if (!token) throw new Error('Missing token!');
	// Bail if token is too short or long
	if (token.length !== 128) throw new Error('Invalid token length!');

	// Check token is valid
	const valid = twoFactorTokens.has(token);

	// Bail if token is invalid
	if (!valid) throw new Error('Invalid token!');

	// Generate new token
	twoFactorTokens.set('root', generateTwoFactorToken());
};
