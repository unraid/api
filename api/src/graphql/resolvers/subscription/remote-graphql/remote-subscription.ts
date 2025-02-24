import { type RemoteGraphQLEventFragmentFragment } from '@app/graphql/generated/client/graphql.js';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription.js';
import { store } from '@app/store/index.js';

export const createRemoteSubscription = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    await store.dispatch(addRemoteSubscription(data));
};
