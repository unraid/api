/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import GraphQLJSON from 'graphql-type-json';
import GraphQLLong from 'graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLScalarType } from 'graphql';
import { Query } from '@app/graphql/resolvers/query';
import { Mutation } from '@app/graphql/resolvers/mutation';
import { Subscription } from '@app/graphql/resolvers/subscription';
import { UserAccount } from '@app/graphql/resolvers/user-account';

export const JSON = GraphQLJSON;
export const Long = GraphQLLong;
export const UUID = GraphQLUUID as GraphQLScalarType;
export const DateTime = GraphQLDateTime;

export {
	Query,
	Mutation,
	Subscription,
	UserAccount,
};
