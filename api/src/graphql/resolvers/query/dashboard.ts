/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateData } from '@app/common/dashboard/generate-data';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Resolvers } from '@app/graphql/generated/api/types';

const dashboardResolver: NonNullable<Resolvers['Query']>['dashboard'] = async (_, __, context) => {
	ensurePermission(context.user, {
		resource: 'dashboard',
		action: 'read',
		possession: 'own',
	});

	const dashboard = await generateData();
	return dashboard;
};

export default dashboardResolver;
