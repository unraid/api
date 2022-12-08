/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { SliceState as EmhttpState } from '@app/store/modules/emhttp';

export type Cloud = {
	error: string | null;
	apiKey: { valid: true; error: null } | { valid: false; error: string };
	minigraphql: {
		status: 'connected' | 'disconnected';
	};
	cloud: { status: 'ok'; error: null; ip: string } | { status: 'error'; error: string };
	allowedOrigins: string[];
	emhttp: {
		mode: EmhttpState['mode'];
	};
};

export const createResponse = (cloud: Omit<Cloud, 'error'>): Cloud => ({
	...cloud,
	error: cloud.apiKey.error ?? cloud.cloud.error,
});
