import { DateTimeResolver, JSONResolver, PortResolver, UUIDResolver } from 'graphql-scalars';

import { Subscription } from '@app/graphql/resolvers/subscription';
import { type Resolvers } from '@app/graphql/generated/api/types';
import { GraphQLLong } from '@app/graphql/resolvers/graphql-type-long';
import { domainResolver } from '@app/core/modules/index';

export const resolvers: Resolvers = {
    JSON: JSONResolver,
    Long: GraphQLLong,
    UUID: UUIDResolver,
    DateTime: DateTimeResolver,
    Port: PortResolver,
    Subscription,
    Vms: {
        domain: domainResolver,
    },
};
