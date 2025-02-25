import { createAsyncThunk } from '@reduxjs/toolkit';

import type { RemoteGraphQLEventFragmentFragment } from '@app/graphql/generated/client/graphql.js';
import { remoteQueryLogger } from '@app/core/log.js';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client.js';
import { RemoteGraphQLEventType } from '@app/graphql/generated/client/graphql.js';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations.js';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers.js';
import { GraphQLClient } from '@app/mothership/graphql-client.js';
import { hasRemoteSubscription } from '@app/store/getters/index.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';
import { type SubscriptionWithSha256 } from '@app/store/types.js';

export const addRemoteSubscription = createAsyncThunk<
    SubscriptionWithSha256,
    RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData'],
    { state: RootState; dispatch: AppDispatch }
>('remoteGraphQL/addRemoteSubscription', async (data, { getState }) => {
    if (hasRemoteSubscription(data.sha256, getState())) {
        throw new Error(`Subscription Already Exists for SHA256: ${data.sha256}`);
    }

    const { config } = getState();

    remoteQueryLogger.debug('Creating subscription for %o', data);
    const apiKey = config.remote.localApiKey;

    if (!apiKey) {
        throw new Error('Local API key is missing');
    }

    const body = parseGraphQLQuery(data.body);
    const client = getApiApolloClient({
        localApiKey: apiKey,
    });
    const mothershipClient = GraphQLClient.getInstance();
    const observable = client.subscribe({
        query: body.query,
        variables: body.variables,
    });
    const subscription = observable.subscribe({
        async next(val) {
            remoteQueryLogger.debug('Got value %o', val);
            if (val.data) {
                const result = await mothershipClient?.mutate({
                    mutation: SEND_REMOTE_QUERY_RESPONSE,
                    variables: {
                        input: {
                            sha256: data.sha256,
                            body: JSON.stringify({ data: val.data }),
                            type: RemoteGraphQLEventType.REMOTE_SUBSCRIPTION_EVENT,
                        },
                    },
                });
                remoteQueryLogger.debug('Remote Query Publish Result %o', result);
            }
        },
        async error(errorValue) {
            try {
                await mothershipClient?.mutate({
                    mutation: SEND_REMOTE_QUERY_RESPONSE,
                    variables: {
                        input: {
                            sha256: data.sha256,
                            body: JSON.stringify({ errors: errorValue }),
                            type: RemoteGraphQLEventType.REMOTE_SUBSCRIPTION_EVENT,
                        },
                    },
                });
            } catch (error) {
                remoteQueryLogger.info('Failed to mutate error result to endpoint');
            }
            remoteQueryLogger.error('Error executing remote subscription: %o', errorValue);
        },
    });

    return {
        sha256: data.sha256,
        subscription,
    };
});
