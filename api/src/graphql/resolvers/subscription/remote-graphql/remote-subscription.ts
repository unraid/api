import {
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';
import { store } from '@app/store/index';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription';
import { clearSubscription } from '@app/store/modules/remote-graphql';
import { remoteAccessLogger } from '@app/core/log';
import { TWO_MINUTES_MS } from '@app/consts';

export const getRemoteSubscriptionTimeout = (sha256: string, dispatch = store.dispatch) => {
    const timeout = setTimeout(async () => {
        remoteAccessLogger.info(
            'No Pings Received in 2 Minutes, Clearing remote subscription with sha: %s',
            sha256
        );
        dispatch(clearSubscription(sha256));
    }, TWO_MINUTES_MS);
    return timeout;
}

export const createRemoteSubscription = async (
    data: RemoteGraphQLEventFragmentFragment['remoteGraphQLEventData']
) => {
    await store.dispatch(addRemoteSubscription(data));
};
