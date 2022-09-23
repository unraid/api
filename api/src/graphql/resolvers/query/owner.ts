/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context, getServers } from '@app/graphql/schema/utils';
import { getters } from '@app/store';

export default async (_: unknown, __: unknown, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any',
	});

	// This should always return the server with a matching guid as this is this server
	const emhttp = getters.emhttp();
	const { flashGuid } = emhttp.var;

	logger.trace('Looking for cached server with flashGuid=%s', flashGuid);

	// Check the user has servers in their account
	const servers = flashGuid ? await getServers() : [];
	if (servers.length === 0) {
		logger.trace('While resolving "owner" we found no servers.');
		return null;
	}

	// Check if we got a server with a matching API key
	const server = flashGuid ? servers?.find(server => server.guid === flashGuid) : null;
	if (!server) {
		logger.trace('While resolving "owner" we found no server response.');
		return null;
	}

	// Check if the server we found had an owner object
	const owner = server?.owner;
	if (!owner) {
		logger.trace('While resolving "owner" we found no owner matching our flashGuid.');
		return null;
	}

	// Return the owner
	logger.trace('Found owner of this server "%s"', owner?.username);
	return owner;
};
