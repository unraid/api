import { TWO_MINUTES_MS } from '@app/consts';
import { getApiApolloClient } from '@app/graphql/client/api/get-api-client';
import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { getters } from '@app/store/index';
import { parseGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-graphql-helpers';
import { SEND_REMOTE_QUERY_RESPONSE } from '@app/graphql/mothership/mutations';
import { remoteQueryLogger } from '@app/core/log';
import { type Subscription } from 'zen-observable-ts'

const subscriptions: Record<
    string,
    { subscription: Subscription; timeout: NodeJS.Timeout }
> = {};

const clearSubscription = (sha256: string) => {
    const subscription = subscriptions[sha256];
    if (subscription) {
        clearTimeout(subscription.timeout)
        subscription.subscription.unsubscribe()
    }
    delete(subscriptions[sha256]);
}

export const renewSubscription = (sha256: string) => {
    const subscription = subscriptions[sha256];
    if (subscription) {
        clearTimeout(subscription.timeout);

        subscription.timeout = setTimeout(() => {
            clearSubscription(sha256)
        }, TWO_MINUTES_MS);
    }
};


export const createRemoteSubscription = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    remoteQueryLogger.debug('Creating subscription for %o', data);
    const apiKey = getters.config().remote.apikey;
    const body = parseGraphQLQuery(data.body);
    const client = getApiApolloClient({
        upcApiKey: apiKey,
    })
    if (subscriptions[data.sha256]) {
        remoteQueryLogger.debug('Subscription already exists for this entry');
        return;
    }
    const mothershipClient = GraphQLClient.getInstance()
    const subscription = client.subscribe({ query: body.query, variables: body.variables });
    const sub = subscription.subscribe({ async next(val)  {
        remoteQueryLogger.debug('Got value %o', val)
        if (val.data){
            const result = await mothershipClient?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256: data.sha256,
                        body: JSON.stringify(val.data),
                        type: RemoteGraphQLEventType.REMOTE_SUBSCRIPTION_EVENT
                    }
                }
            })
            remoteQueryLogger.debug('result %o', result)
        }

    }, error(errorValue) {
        remoteQueryLogger.error(errorValue)
    } });
    subscriptions[data.sha256] = { subscription: sub, timeout: setTimeout(() => clearSubscription(data.sha256), TWO_MINUTES_MS)}
};
