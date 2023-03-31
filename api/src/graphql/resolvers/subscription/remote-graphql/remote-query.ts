import { remoteQueryLogger } from '@app/core/log';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client';
import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers';
import { GraphQLClient } from '@app/mothership/graphql-client';

export const executeRemoteGraphQLQuery = async (
    event: RemoteGraphQLEventFragmentFragment
) => {
    const client = GraphQLClient.getInstance();
    const originalBody = event.remoteGraphQLEventData.body;
    try {
        const parsedQuery = parseGraphQLQuery(originalBody);
        const localClient = getApiApolloClient({
            upcApiKey: event.remoteGraphQLEventData.apiKey,
        });
        const localResult = await localClient.query({
            query: parsedQuery.query,
            variables: parsedQuery.variables,
        });
        if (localResult.data) {
            remoteQueryLogger.debug(localResult.data);

            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: event.remoteGraphQLEventData.sha256,
                        body: JSON.stringify({ data: localResult.data }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
                errorPolicy: 'none',
            });
        } else {
            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: event.remoteGraphQLEventData.sha256,
                        body: JSON.stringify({ errors: localResult.errors }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
            });
        }
    } catch (err) {
        try {
            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: event.remoteGraphQLEventData.sha256,
                        body: JSON.stringify({ errors: err }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
            });
        } catch (error) {
            remoteQueryLogger.warn('Could not respond %o', error);
        }
        remoteQueryLogger.error('Error executing remote query %o', err);
    }
};
