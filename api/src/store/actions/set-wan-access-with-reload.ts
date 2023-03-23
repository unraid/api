import { NginxManager } from '@app/core/modules/services/nginx';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setWanAccess } from '@app/store/modules/config';
import { createAsyncThunk } from '@reduxjs/toolkit';

type EnableWanAccessArgs = Parameters<typeof setWanAccess>[0];
export const setWanAccessAndReloadNginx = createAsyncThunk<void, EnableWanAccessArgs, { state: RootState; dispatch: AppDispatch }>('config/setWanAccessAndReloadNginx', async (payload, { dispatch }) => {
	const manager = new NginxManager();
	dispatch(setWanAccess(payload));
	await manager.reloadNginx();
});
