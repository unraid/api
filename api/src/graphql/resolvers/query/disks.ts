/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import graphqlFields from 'graphql-fields';
import { getDisks } from '@app/core/modules/get-disks';
import { type QueryResolvers } from '@app/graphql/generated/api/types';

export const disksResolver: QueryResolvers['disks'] = async (_, args, context, info) => {
	const topLevelFields = Object.keys(graphqlFields(info));
	const disks = await getDisks(context, { temperature: topLevelFields.includes('temperature') });
	return disks;
};
