import { totp, authenticator } from 'otplib';

const twoFactorSecret = authenticator.generateSecret(64);

/**
 * Generate `103` character long secret.
 */
export const generateTwoFactorToken = () => totp.generate(twoFactorSecret);

/**
 * Verify 2FA token.
 *
 * If the token is missing, too short, too long or invalid an error will be thrown.
 */
export const verifyTwoFactorToken = (token: string) => {
	// Bail if token is missing
	if (!token) throw new Error('Missing token!');
	// Bail if token is too short or long
	if (token.length !== 103) throw new Error('Invalid token length!');

	// Check token is valid
	const valid = totp.verify({ token, secret: twoFactorSecret });

	// Bail if token is invalid
	if (!valid) throw new Error('Invalid token!');
};
