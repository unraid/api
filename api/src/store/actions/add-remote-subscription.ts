import { remoteQueryLogger } from '@app/core/log';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client';
import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { hasRemoteSubscription } from '@app/store/getters/index';
import { type AppDispatch, type RootState } from '@app/store/index';
import { type SubscriptionWithSha256 } from '@app/store/types';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const addRemoteSubscription = createAsyncThunk<
    SubscriptionWithSha256,
    RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData'],
    { state: RootState; dispatch: AppDispatch }
>(
    'remoteGraphQL/addRemoteSubscription',
    async (data, { getState }) => {
        if (hasRemoteSubscription(data.sha256, getState())) {
            throw new Error(
                `Subscription Already Exists for SHA256: ${data.sha256}`
            );
        }

        const { config } = getState();

        remoteQueryLogger.debug('Creating subscription for %o', data);
        const apiKey = config.remote.apikey;
        const body = parseGraphQLQuery(data.body);
        const client = getApiApolloClient({
            upcApiKey: apiKey,
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
                    remoteQueryLogger.info('Failed to mutate error result to endpoint')
                }
                remoteQueryLogger.error('Error executing remote subscription: %o', errorValue);
            },
        });

        return {
            sha256: data.sha256,
            subscription,
        };
    }
);
