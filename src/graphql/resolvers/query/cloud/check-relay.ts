/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { RelayStates } from '@app/graphql/relay-state';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { getRelayConnectionStatus, getRelayDisconnectionReason, getRelayReconnectingTimeout } from '@app/mothership/get-relay-connection-status';

export const checkRelay = (): Cloud['relay'] => {
	logger.trace('Cloud endpoint: Checking relay');
	try {
		return {
			status: getRelayConnectionStatus().toLowerCase() as RelayStates,
			timeout: getRelayReconnectingTimeout(),
			error: getRelayDisconnectionReason() ?? ''
		};
	} finally {
		logger.trace('Cloud endpoint: Done relay');
	}
};
