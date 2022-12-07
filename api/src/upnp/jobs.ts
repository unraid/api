/* eslint-disable new-cap */
import { Cron, Expression, Initializer } from '@reflet/cron';
import { removeUpnpLease, renewUpnpLease } from '@app/upnp/helpers';

let upnpJobs: ReturnType<typeof UPNPJobManager.init<UPNPJobManager>> | null = null;

export class UPNPJobManager extends Initializer<typeof UPNPJobManager> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_30_MINUTES)
	@Cron.OnComplete(removeUpnpLease)
	async renewUpnpLeaseJob() {
		await renewUpnpLease();
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
