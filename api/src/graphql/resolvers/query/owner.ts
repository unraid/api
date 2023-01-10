import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getters } from '@app/store';
import { type Resolvers } from '@app/graphql/generated/api/types';

const ownerResolver: NonNullable<Resolvers['Query']>['owner'] = (_, __, context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any',
	});

	const { remote } = getters.config();

	if (!remote.username) {
		return {
			username: 'root',
			avatar: '',
			url: '',
		};
	}

	return {
		username: remote.username,
		avatar: remote.avatar,
	};
};

export default ownerResolver;
