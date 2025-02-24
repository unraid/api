import { createAsyncThunk } from '@reduxjs/toolkit';

import { reloadNginxAndUpdateDNS } from '@app/store/actions/reload-nginx-and-update-dns.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';
import { setWanAccess } from '@app/store/modules/config.js';

type EnableWanAccessArgs = Parameters<typeof setWanAccess>[0];
export const setWanAccessAndReloadNginx = createAsyncThunk<
    void,
    EnableWanAccessArgs,
    { state: RootState; dispatch: AppDispatch }
>('config/setWanAccessAndReloadNginx', async (payload, { dispatch }) => {
    dispatch(setWanAccess(payload));

    await dispatch(reloadNginxAndUpdateDNS());
});
