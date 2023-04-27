import { remoteQueryLogger } from '@app/core/log';
import { ENVIRONMENT } from '@app/environment';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client';
import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { getters } from '@app/store/index';

export const executeRemoteGraphQLQuery = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    remoteQueryLogger.addContext('data', data);
    remoteQueryLogger.debug('Executing remote query');
    remoteQueryLogger.removeContext('data');
    const client = GraphQLClient.getInstance();
    const apiKey = getters.config().remote.apikey;
    const originalBody = data.body;
    try {
        const parsedQuery = parseGraphQLQuery(originalBody);
        const localClient = getApiApolloClient({
            upcApiKey: apiKey
        });
        if (ENVIRONMENT === 'development') {
            remoteQueryLogger.debug('Running query', parsedQuery.query);
        }
        const localResult = await localClient.query({
            query: parsedQuery.query,
            variables: parsedQuery.variables,
        });
        if (localResult.data) {
            remoteQueryLogger.addContext('data', localResult.data);
            remoteQueryLogger.trace('Got data from remoteQuery request', data.sha256);
            remoteQueryLogger.removeContext('data')

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
        remoteQueryLogger.addContext('error', err);
        remoteQueryLogger.error('Error executing remote query %s', err instanceof Error ? err.message: 'Unknown Error');
        remoteQueryLogger.removeContext('error');
    }
};
