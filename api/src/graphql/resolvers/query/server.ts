import { getServers } from '@app/graphql/schema/utils';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type QueryResolvers } from '@app/graphql/generated/api/types';

export const server: QueryResolvers['server'] =  async (_: unknown, { name }, context) => {
	ensurePermission(context.user, {
		resource: 'servers',
		action: 'read',
		possession: 'any',
	});

	const servers = getServers();

	// Single server
	return servers.find(server => server.name === name) ?? undefined;
};
