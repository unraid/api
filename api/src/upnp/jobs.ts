import { CronJob } from 'cron';

import { upnpLogger } from '@app/core/log';
import { store } from '@app/store';
import { enableUpnp } from '@app/store/modules/upnp';

class UPNPJobManager {
    private renewalTask: CronJob | null = null;

    constructor() {
        this.renewalTask = new CronJob(
            '*/30 * * * *',
            async () => {
                try {
                    upnpLogger.trace('Running UPNP Renewal Job');
                    await store.dispatch(enableUpnp());
                } catch (error) {
                    upnpLogger.error('Error in UPNP renewal job:', error);
                }
            },
            null, // onComplete
            false, // start
            'UTC' // timezone
        );
    }

    start() {
        this.renewalTask?.start();
        return this.isRunning();
    }

    stop() {
        this.renewalTask?.stop();
        return this.isRunning();
    }

    isRunning(): boolean {
        return this.renewalTask?.running ?? false;
    }
}

let upnpJobs: UPNPJobManager | null = null;

export const initUpnpJobs = (): boolean => {
    if (!upnpJobs) {
        upnpJobs = new UPNPJobManager();
    }

    return upnpJobs.start();
};

export const stopUpnpJobs = (): boolean => {
    upnpLogger.debug('Stopping UPNP Jobs');
    return upnpJobs?.stop() ?? false;
};
