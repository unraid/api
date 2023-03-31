import {
    RemoteGraphQLEventType,
    type RemoteGraphQLEventFragmentFragment,
} from '@app/graphql/generated/client/graphql';

import { type AppDispatch, type RootState } from '@app/store/index';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { remoteQueryLogger } from '@app/core/log';
import { executeRemoteGraphQLQuery } from '@app/graphql/resolvers/subscription/remote-graphql/remote-query';

export const handleRemoteGraphQLEvent = createAsyncThunk<
    void,
    RemoteGraphQLEventFragmentFragment,
    { state: RootState; dispatch: AppDispatch }
>(
    'dynamicRemoteAccess/handleRemoteAccessEvent',
    async (event, { getState, dispatch }) => {
        const data = event.remoteGraphQLEventData;
        switch (data.type) {
            case RemoteGraphQLEventType.REMOTE_MUTATION_EVENT:
                break;
            case RemoteGraphQLEventType.REMOTE_QUERY_EVENT:
                remoteQueryLogger.debug('Responding to remote query event');
                return await executeRemoteGraphQLQuery(event);
            case RemoteGraphQLEventType.REMOTE_SUBSCIPTION_EVENT:
                break;
        }
    }
);
