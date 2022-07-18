/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { HumanRelayStates } from '@app/graphql/relay-state';

export type Cloud = {
	error?: string;
	apiKey: { valid: true; error: undefined } | { valid: false; error: string };
	relay: {
		status: HumanRelayStates;
		timeout: undefined;
		error: undefined;
	} | {
		status: HumanRelayStates;
		timeout: number | undefined;
		error: string;
	};
	minigraphql: {
		status: 'connected' | 'disconnected';
	};
	cloud: { status: 'ok'; error: undefined; ip: string } | { status: 'error'; error: string };
	allowedOrigins: string[];
};

export const createResponse = (cloud: Cloud): Cloud => ({
	...cloud,
	error: cloud.apiKey.error ?? cloud.relay.error ?? cloud.cloud.error,
});
