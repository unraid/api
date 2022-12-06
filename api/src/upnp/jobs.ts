/* eslint-disable new-cap */
import { Cron, Expression, Initializer } from '@reflet/cron';
import { renewUpnpLease } from '@app/upnp/helpers';

export class UPNPJobManager extends Initializer<typeof UPNPJobManager> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_10_MINUTES)
	async renewUpnpLeaseJob() {
		await renewUpnpLease();
	}
}

export const UPNPJobs = UPNPJobManager.init();
