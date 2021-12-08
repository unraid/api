import { randomBytes } from 'crypto';

/**
 * Generate two factor secret.
 */
export const generateTwoFactorToken = () => randomBytes(64).toString('hex');

/**
 * The current 2FA code for the root user.
 */
let currentTwoFactorToken = generateTwoFactorToken();

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
	const valid = currentTwoFactorToken === token;

	// Bail if token is invalid
	if (!valid) throw new Error('Invalid token!');

	// Generate new token
	currentTwoFactorToken = generateTwoFactorToken();
};
