import { minigraphLogger, mothershipLogger } from '@app/core/log';
import { GraphQLClient } from './graphql-client';
import { store } from '@app/store';

import {
    EVENTS_SUBSCRIPTION,
    RemoteGraphQL_Fragment,
} from '@app/graphql/mothership/subscriptions';

import { ClientType } from '@app/graphql/generated/client/graphql';
import { notNull } from '@app/utils';
import { useFragment } from '@app/graphql/generated/client/fragment-masking';
import { handleRemoteGraphQLEvent } from '@app/store/actions/handle-remote-graphql-event';
import {
    setSelfDisconnected,
    setSelfReconnected,
} from '@app/store/modules/minigraph';

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
            mothershipLogger.error(
                'GraphQL Error with events subscription: %s',
                errors.join(',')
            );
        } else if (data) {
            mothershipLogger.trace(
                { events: data.events },
                'Got events from mothership'
            );

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
                        const eventAsRemoteGraphQLEvent = useFragment(
                            RemoteGraphQL_Fragment,
                            event
                        );
                        // No need to check API key here anymore

                        void store.dispatch(
                            handleRemoteGraphQLEvent(eventAsRemoteGraphQLEvent)
                        );
                        break;
                    }

                    default:
                        break;
                }
            }
        }
    });
};
