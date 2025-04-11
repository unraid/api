import { createAsyncThunk } from '@reduxjs/toolkit';

import type { RemoteGraphQlEventFragmentFragment } from '@app/graphql/generated/client/graphql.js';
import { remoteQueryLogger } from '@app/core/log.js';
import { RemoteGraphQlEventType } from '@app/graphql/generated/client/graphql.js';
import { executeRemoteGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-query.js';
import { createRemoteSubscription } from '@app/graphql/resolvers/subscription/remote-graphql/remote-subscription.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';
import { renewRemoteSubscription } from '@app/store/modules/remote-graphql.js';

export const handleRemoteGraphQLEvent = createAsyncThunk<
    void,
    RemoteGraphQlEventFragmentFragment,
    { state: RootState; dispatch: AppDispatch }
>('dynamicRemoteAccess/handleRemoteAccessEvent', async (event, { dispatch }) => {
    const data = event.remoteGraphQLEventData;
    switch (data.type) {
        case RemoteGraphQlEventType.REMOTE_MUTATION_EVENT:
            break;
        case RemoteGraphQlEventType.REMOTE_QUERY_EVENT:
            remoteQueryLogger.debug('Responding to remote query event');
            return await executeRemoteGraphQLQuery(event.remoteGraphQLEventData);
        case RemoteGraphQlEventType.REMOTE_SUBSCRIPTION_EVENT:
            remoteQueryLogger.debug('Responding to remote subscription event');
            return await createRemoteSubscription(data);
        case RemoteGraphQlEventType.REMOTE_SUBSCRIPTION_EVENT_PING:
            await dispatch(renewRemoteSubscription({ sha256: data.sha256 }));
            break;
    }
});
