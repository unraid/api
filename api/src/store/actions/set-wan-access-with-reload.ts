import { reloadNginxAndUpdateDNS } from '@app/store/actions/reload-nginx-and-update-dns';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setWanAccess } from '@app/store/modules/config';
import { createAsyncThunk } from '@reduxjs/toolkit';

type EnableWanAccessArgs = Parameters<typeof setWanAccess>[0];
export const setWanAccessAndReloadNginx = createAsyncThunk<void, EnableWanAccessArgs, { state: RootState; dispatch: AppDispatch }>('config/setWanAccessAndReloadNginx', async (payload, { dispatch }) => {
	dispatch(setWanAccess(payload));

	await dispatch(reloadNginxAndUpdateDNS())
});
