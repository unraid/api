import { type RemoteGraphQLEventFragmentFragment } from '@app/graphql/generated/client/graphql';
import { GraphQLClient } from '@app/mothership/graphql-client';

const createSubscriptionWithMutationListener = async () => {};

const executeOrCancelRemoteSubscription = async (
    event: RemoteGraphQLEventFragmentFragment
) => {
    const client = GraphQLClient.getInstance();
    const originalBody = event.remoteGraphQLEventData.body;

    try {
    } catch (error) {}
};
