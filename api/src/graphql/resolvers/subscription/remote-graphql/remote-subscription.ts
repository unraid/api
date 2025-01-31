import { type RemoteGraphQLEventFragmentFragment } from '@app/graphql/generated/client/graphql';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription';
import { store } from '@app/store/index';

export const createRemoteSubscription = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    await store.dispatch(addRemoteSubscription(data));
};
