import { minigraphLogger, mothershipLogger } from '@app/core/log';
import { useFragment } from '@app/graphql/generated/client/fragment-masking';
import { ClientType } from '@app/graphql/generated/client/graphql';
import { EVENTS_SUBSCRIPTION, RemoteGraphQL_Fragment } from '@app/graphql/mothership/subscriptions';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { initPingTimeoutJobs, PingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs';
import { getMothershipConnectionParams } from '@app/mothership/utils/get-mothership-websocket-headers';
import { store } from '@app/store';
import { handleRemoteGraphQLEvent } from '@app/store/actions/handle-remote-graphql-event';
import { setSelfDisconnected, setSelfReconnected } from '@app/store/modules/minigraph';
import { notNull } from '@app/utils';

export const subscribeToEvents = async (apiKey: string) => {
    minigraphLogger.info('Subscribing to Events');
    const client = GraphQLClient.getInstance();
    if (!client) {
        throw new Error('Unable to use client - state must not be loaded');
    }

    const eventsSub = client.subscribe({
        query: EVENTS_SUBSCRIPTION,
        fetchPolicy: 'no-cache',
    });
    eventsSub.subscribe(async ({ data, errors }) => {
        if (errors) {
            mothershipLogger.error('GraphQL Error with events subscription: %s', errors.join(','));
        } else if (data) {
            mothershipLogger.trace({ events: data.events }, 'Got events from mothership');

            for (const event of data.events?.filter(notNull) ?? []) {
                switch (event.__typename) {
                    case 'ClientConnectedEvent': {
                        const {
                            connectedData: { type, apiKey: eventApiKey },
                        } = event;
                        // Another server connected to Mothership
                        if (type === ClientType.API) {
                            if (eventApiKey === apiKey) {
                                // We are online, clear timeout waiting if it's set
                                store.dispatch(setSelfReconnected());
                            }
                        }

                        break;
                    }

                    case 'ClientDisconnectedEvent': {
                        const {
                            disconnectedData: { type, apiKey: eventApiKey },
                        } = event;
                        // Server Disconnected From Mothership
                        if (type === ClientType.API) {
                            if (eventApiKey === apiKey) {
                                store.dispatch(setSelfDisconnected());
                            }
                        }

                        break;
                    }

                    case 'RemoteGraphQLEvent': {
                        const eventAsRemoteGraphQLEvent = useFragment(RemoteGraphQL_Fragment, event);
                        // No need to check API key here anymore

                        void store.dispatch(handleRemoteGraphQLEvent(eventAsRemoteGraphQLEvent));
                        break;
                    }

                    default:
                        break;
                }
            }
        }
    });
};

export const setupNewMothershipSubscription = async (state = store.getState()) => {
    await GraphQLClient.clearInstance();
    if (getMothershipConnectionParams(state)?.apiKey) {
        minigraphLogger.trace('Creating Graphql client');
        const client = GraphQLClient.createSingletonInstance();
        if (client) {
            minigraphLogger.trace('Connecting to mothership');
            await subscribeToEvents(state.config.remote.apikey);
            initPingTimeoutJobs();
        }
    }
};
