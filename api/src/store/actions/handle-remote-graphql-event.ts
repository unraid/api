import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';

import { type AppDispatch, type RootState } from '@app/store/index';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { remoteQueryLogger } from '@app/core/log';
import { executeRemoteGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-query';
import { createRemoteSubscription, renewSubscription } from '@app/graphql/resolvers/subscription/remote-graphql/remote-subscription';

export const handleRemoteGraphQLEvent = createAsyncThunk<
    void,
    RemoteGraphQLEventFragmentFragment,
    { state: RootState; dispatch: AppDispatch }
>(
    'dynamicRemoteAccess/handleRemoteAccessEvent',
    async (event) => {
        const data = event.remoteGraphQLEventData;
        switch (data.type) {
            case RemoteGraphQLEventType.REMOTE_MUTATION_EVENT:
                break;
            case RemoteGraphQLEventType.REMOTE_QUERY_EVENT:
                remoteQueryLogger.debug('Responding to remote query event');
                return await executeRemoteGraphQLQuery(event.remoteGraphQLEventData);
            case RemoteGraphQLEventType.REMOTE_SUBSCRIPTION_EVENT:
                remoteQueryLogger.debug('Responding to remote subscription event');
                return await createRemoteSubscription(data);
            case RemoteGraphQLEventType.REMOTE_SUBSCRIPTION_EVENT_PING:
                renewSubscription(data.sha256);
                break;
        }
    }
);
