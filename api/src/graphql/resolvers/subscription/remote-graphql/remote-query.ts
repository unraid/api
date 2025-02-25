import type { RemoteGraphQLEventFragmentFragment } from '@app/graphql/generated/client/graphql.js';
import { remoteQueryLogger } from '@app/core/log.js';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client.js';
import { RemoteGraphQLEventType } from '@app/graphql/generated/client/graphql.js';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations.js';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers.js';
import { GraphQLClient } from '@app/mothership/graphql-client.js';
import { getters } from '@app/store/index.js';

export const executeRemoteGraphQLQuery = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    remoteQueryLogger.debug({ query: data }, 'Executing remote query');
    const client = GraphQLClient.getInstance();
    const localApiKey = getters.config().remote.localApiKey;

    if (!localApiKey) {
        throw new Error('Local API key is missing');
    }

    const apiKey = localApiKey;
    const originalBody = data.body;

    try {
        const parsedQuery = parseGraphQLQuery(originalBody);
        const localClient = getApiApolloClient({
            localApiKey: apiKey,
        });
        remoteQueryLogger.trace({ query: parsedQuery.query }, '[DEVONLY] Running query');
        const localResult = await localClient.query({
            query: parsedQuery.query,
            variables: parsedQuery.variables,
        });
        if (localResult.data) {
            remoteQueryLogger.trace(
                { data: localResult.data },
                'Got data from remoteQuery request',
                data.sha256
            );

            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: data.sha256,
                        body: JSON.stringify({ data: localResult.data }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
                errorPolicy: 'none',
            });
        } else {
            // @TODO fix this not sending an error
            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: data.sha256,
                        body: JSON.stringify({ errors: localResult.error }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
            });
        }
    } catch (err: unknown) {
        try {
            await client?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: data.sha256,
                        body: JSON.stringify({ errors: err }),
                        type: RemoteGraphQLEventType.REMOTE_QUERY_EVENT,
                    },
                },
            });
        } catch (error) {
            remoteQueryLogger.warn('Could not respond %o', error);
        }
        remoteQueryLogger.error(
            'Error executing remote query %s',
            err instanceof Error ? err.message : 'Unknown Error'
        );
        remoteQueryLogger.trace(err);
    }
};
