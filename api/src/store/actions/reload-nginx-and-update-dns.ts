import { remoteAccessLogger } from '@app/core/log';
import { NginxManager } from '@app/core/modules/services/nginx';
import { UpdateDNSManager } from '@app/core/modules/services/update-dns';
import { type AppDispatch, type RootState } from '@app/store/index';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const reloadNginxAndUpdateDNS = createAsyncThunk<void, void, { state: RootState; dispatch: AppDispatch }>('config/reloadNginxAndUpdateDNS', async () => {
    remoteAccessLogger.debug('Reloading Nginx and Updating DNS');
	const manager = new NginxManager();
	const updateDns = new UpdateDNSManager();
	await manager.reloadNginx();
	await updateDns.updateDNS();
    remoteAccessLogger.debug('Finished Reloading Nginx and Updating DNS');

});
