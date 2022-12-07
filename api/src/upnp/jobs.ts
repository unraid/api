/* eslint-disable new-cap */
import { Cron, Expression, Initializer } from '@reflet/cron';
import { store } from '@app/store';
import { enableUpnp } from '@app/store/modules/upnp';
import { upnpLogger } from '@app/core/log';

let upnpJobs: ReturnType<typeof UPNPJobManager.init<UPNPJobManager>> | null = null;

export class UPNPJobManager extends Initializer<typeof UPNPJobManager> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_30_MINUTES)
	async renewUpnpLeaseJob() {
		upnpLogger.trace('Running UPNP Renewal Job');
		void store.dispatch(enableUpnp());
	}
}

export const initUpnpJobs = (): boolean => {
	if (!upnpJobs) {
		upnpJobs = UPNPJobManager.init();
	}

	upnpJobs.get('renewUpnpLeaseJob').start();
	return upnpJobs.get('renewUpnpLeaseJob').running ?? false;
};

export const stopUpnpJobs = (): boolean => {
	upnpLogger.debug('Stopping UPNP Jobs');
	upnpJobs?.get('renewUpnpLeaseJob').stop();
	return upnpJobs?.get('renewUpnpLeaseJob').running ?? false;
};
