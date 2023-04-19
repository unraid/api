import { DateTimeResolver, JSONResolver, UUIDResolver } from 'graphql-scalars';

import { Query } from '@app/graphql/resolvers/query';
import { Mutation } from '@app/graphql/resolvers/mutation';
import { Subscription } from '@app/graphql/resolvers/subscription';
import { UserAccount } from '@app/graphql/resolvers/user-account';
import { type Resolvers } from '../generated/api/types';
import { infoSubResolvers } from './query/info';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';
import { domainResolver } from '@app/core/modules/index';

export const resolvers: Resolvers = {
    JSON: JSONResolver,
    Long: GraphQLLong,
    UUID: UUIDResolver,
    DateTime: DateTimeResolver,
    Query,
    Mutation,
    Subscription,
    UserAccount,
    Info: {
        ...infoSubResolvers,
    },
    Vms: {
        domain: domainResolver,
    },
};
