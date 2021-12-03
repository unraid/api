/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { totp } from 'otplib';
import { totpSecret } from '../../../common/2fa';

export default async () => {
	// Ensure we have a secret set
	if (!totpSecret) {
		return {
			code: null,
			error: 'Missing TOTP secret'
		};
	}

	// Return code
	return totp.generate(totpSecret);
};
