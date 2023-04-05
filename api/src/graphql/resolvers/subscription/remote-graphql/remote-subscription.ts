import {
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { store } from '@app/store/index';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription';

export const createRemoteSubscription = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    await store.dispatch(addRemoteSubscription(data));
};
