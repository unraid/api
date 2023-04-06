import { ONE_MINUTE_MS } from '@app/consts';
import { mothershipLogger } from '@app/core/log';
import { sleep } from '@app/core/utils/misc/sleep';
import { SEND_PING_MUTATION } from '@app/graphql/mothership/mutations';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { convertToFuzzyTime } from '@app/mothership/utils/convert-to-fuzzy-time';
import { type AppDispatch, type RootState } from '@app/store/index';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const sendMothershipPing = createAsyncThunk<
    boolean,
    void,
    { state: RootState; dispatch: AppDispatch }
>('mothership/sendPing', async () => {
    // Delay execution for some number of seconds
    const client = GraphQLClient.getInstance();
    if (client) {
        try {
            const randomSleep = convertToFuzzyTime(0, ONE_MINUTE_MS)
            await sleep(randomSleep)
            const result = await client.mutate({
                mutation: SEND_PING_MUTATION,
            });
            mothershipLogger.debug('Result from mothership ping %o', result);

            return result.data?.sendPing ?? false;
        } catch (error) {
            mothershipLogger.debug('Error pinging mothership %o', error);
            return false;
        }
    }
    return false;
});
