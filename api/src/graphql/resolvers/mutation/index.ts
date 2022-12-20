/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { type Resolvers } from '@app/graphql/generated/api/types';
import { sendNotification } from './notifications';

export const Mutation: Resolvers['Mutation'] = {
	sendNotification,
};
