/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import graphqlFields from 'graphql-fields';
import { getDisks } from '@app/core/modules/get-disks';
import { type CoreContext } from '@app/core/types';

export interface Context extends CoreContext {
	params: {
		username: string;
	};
	data: {
		password: string;
	};
}

export default async (_: unknown, args: unknown, context: Context, info: any) => {
	const topLevelFields = Object.keys(graphqlFields(info));
	const disks = await getDisks(context, { temperature: topLevelFields.includes('temperature') });
	return disks.json;
};
