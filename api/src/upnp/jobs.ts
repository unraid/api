/* eslint-disable new-cap */
import { Cron, Expression, Initializer } from '@reflet/cron';
import { removeUpnpLease } from '@app/upnp/helpers';
import { store } from '@app/store';
import { renewLease } from '@app/store/modules/upnp';

let upnpJobs: ReturnType<typeof UPNPJobManager.init<UPNPJobManager>> | null = null;

export class UPNPJobManager extends Initializer<typeof UPNPJobManager> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_30_MINUTES)
	@Cron.OnComplete(removeUpnpLease)
	async renewUpnpLeaseJob() {
		void store.dispatch(renewLease());
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
	upnpJobs?.get('renewUpnpLeaseJob').stop();
	return upnpJobs?.get('renewUpnpLeaseJob').running ?? false;
};
