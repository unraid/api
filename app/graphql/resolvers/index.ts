/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import GraphQLJSON from 'graphql-type-json';
import GraphQLLong from 'graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import { Query } from './query';
import { Subscription } from './subscription';
import { UserAccount } from './user-account';

export const JSON = GraphQLJSON;
export const Long = GraphQLLong;
export const UUID = GraphQLUUID;

export {
	Query,
	Subscription,
	UserAccount
};
