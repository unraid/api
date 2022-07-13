/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { RelayStates } from '@app/graphql/relay-state';

export type Cloud = {
	error?: string;
	apiKey: { valid: true; error: undefined } | { valid: false; error: string };
	relay: {
		status: RelayStates;
		timeout: undefined;
		error: undefined;
	} | {
		status: RelayStates;
		timeout: number | undefined;
		error: string;
	};
	minigraphql: {
		connected: boolean;
	};
	cloud: { status: 'ok'; error: undefined; ip: string } | { status: 'error'; error: string };
	allowedOrigins: string[];
};

export const createResponse = (cloud: Cloud): Cloud => {
	return {
		...cloud,
		error: cloud.apiKey.error ?? cloud.relay.error ?? cloud.cloud.error
	};
};
