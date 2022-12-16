/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { GraphQLJSON } from 'graphql-type-json';
import { GraphQLLong } from '@app/common/graphql/graphql-type-long';
import GraphQLUUID from 'graphql-type-uuid';
import { GraphQLDateTime } from 'graphql-scalars';
import { type GraphQLScalarType } from 'graphql';
import { Query } from '@app/graphql/resolvers/query';
import { Mutation } from '@app/graphql/resolvers/mutation';
import { Subscription } from '@app/graphql/resolvers/subscription';
import { UserAccount } from '@app/graphql/resolvers/user-account';
import { type Resolvers } from '../generated/api/types';
import { infoSubResolvers } from './query/info';

export const resolvers: Resolvers = {
	JSON: GraphQLJSON,
	Long: GraphQLLong,
	UUID: GraphQLUUID as GraphQLScalarType,
	DateTime: GraphQLDateTime,
	Query,
	Mutation,
	Subscription,
	UserAccount,
	Info: {
		...infoSubResolvers,
	},

};
