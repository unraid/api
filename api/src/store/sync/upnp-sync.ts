import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { store } from '@app/store';
import { logger } from '@app/core';
import { UPNPJobs } from '@app/upnp/jobs';
import { renewUpnpLease } from '@app/upnp/helpers';

let lastRun: number | null = null;

export const syncUpnpChanges: StoreSubscriptionHandler = async lastState => {
	const { config, emhttp } = store.getState();
	if (emhttp.status !== FileLoadStatus.LOADED || config.status !== FileLoadStatus.LOADED) return;

	const { useUpnp } = emhttp.var;
	logger.trace('upnp enabled', useUpnp);
	if (!lastRun || Date.now() - lastRun > 5_000) {
		if (useUpnp) {
			lastRun = Date.now();
			const { wanport } = config.remote;
			logger.trace('Wan PORT IS', wanport, useUpnp);
			// Try to open wan port
			await renewUpnpLease();
			UPNPJobs.get('renewUpnpLeaseJob').start();
		} else {
			UPNPJobs.get('renewUpnpLeaseJob').stop();
		}
	}
};

