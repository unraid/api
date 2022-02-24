/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '../../../core';
import { apiManager } from '../../../core/api-manager';
import { ensurePermission } from '../../../core/utils';
import { Context, getServers } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any'
	});

	// This should always return the server with a matching "my servers" key as this is the owner of the server the API is running on
	const apiKey = apiManager.getValidKeys().find(key => key.name === 'my_servers')?.key.toString()!;

	// Check if the user's key exists
	if (!apiKey) {
		logger.trace('While resolving "owner" we failed fetching servers as no "my_servers" API key was found.');
		return null;
	}

	// Check the user has servers in their account
	const servers = apiKey ? await getServers() : [];
	if (servers.length === 0) {
		logger.trace('While resolving "owner" we found no servers.');
		return null;
	}

	// Check if we got a server with a matching API key
	const server = apiKey ? servers?.find(server => server.apikey === apiKey) : null;
	if (!server) {
		logger.trace('While resolving "owner" we found no server matching our "my_servers" API key.');
		return null;
	}

	// Check if the server we found had an owner object
	const owner = server?.owner;
	if (!owner) {
		logger.trace('While resolving "owner" we found no owner matching our "my_servers" API key.');
		return null;
	}

	// Return the owner
	logger.trace('Found owner of this server "%s"', owner?.username);
	return owner;
};
