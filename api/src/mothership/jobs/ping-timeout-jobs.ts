import { CronJob } from 'cron';

import { KEEP_ALIVE_INTERVAL_MS, ONE_MINUTE_MS } from '@app/consts';
import { minigraphLogger, mothershipLogger, remoteAccessLogger } from '@app/core/log';
import { DynamicRemoteAccessType, MinigraphStatus } from '@app/graphql/generated/api/types';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { store } from '@app/store/index';
import { setRemoteAccessRunningType } from '@app/store/modules/dynamic-remote-access';
import { clearSubscription } from '@app/store/modules/remote-graphql';

class PingTimeoutJobs {
    private cronJob: CronJob;
    private isRunning: boolean = false;

    constructor() {
        // Run every minute
        this.cronJob = new CronJob('* * * * *', this.checkForPingTimeouts.bind(this));
    }

    async checkForPingTimeouts() {
        const state = store.getState();
        if (!isAPIStateDataFullyLoaded(state)) {
            mothershipLogger.warn('State data not fully loaded, but job has been started');
            return;
        }

        // Check for ping timeouts in remote graphql events
        const subscriptionsToClear = state.remoteGraphQL.subscriptions.filter(
            (subscription) => Date.now() - subscription.lastPing > KEEP_ALIVE_INTERVAL_MS
        );
        if (subscriptionsToClear.length > 0) {
            mothershipLogger.debug(
                `Clearing %s / %s subscriptions that are older than ${
                    KEEP_ALIVE_INTERVAL_MS / 1_000 / 60
                } minutes`,
                subscriptionsToClear.length,
                state.remoteGraphQL.subscriptions.length
            );
        }

        subscriptionsToClear.forEach((sub) => store.dispatch(clearSubscription(sub.sha256)));

        // Check for ping timeouts in mothership
        if (
            state.minigraph.lastPing &&
            Date.now() - state.minigraph.lastPing > KEEP_ALIVE_INTERVAL_MS &&
            state.minigraph.status === MinigraphStatus.CONNECTED
        ) {
            minigraphLogger.error(
                `NO PINGS RECEIVED IN ${
                    KEEP_ALIVE_INTERVAL_MS / 1_000 / 60
                } MINUTES, SOCKET MUST BE RECONNECTED`
            );
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.PING_FAILURE,
                    error: 'Ping Receive Exceeded Timeout',
                })
            );
        }
        // Check for ping timeouts from mothership events
        if (
            state.minigraph.selfDisconnectedSince &&
            Date.now() - state.minigraph.selfDisconnectedSince > KEEP_ALIVE_INTERVAL_MS &&
            state.minigraph.status === MinigraphStatus.CONNECTED
        ) {
            minigraphLogger.error(`SELF DISCONNECTION EVENT NEVER CLEARED, SOCKET MUST BE RECONNECTED`);
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.PING_FAILURE,
                    error: 'Received disconnect event for own server',
                })
            );
        }

        // Check for ping timeouts in remote access
        if (
            state.dynamicRemoteAccess.lastPing &&
            Date.now() - state.dynamicRemoteAccess.lastPing > ONE_MINUTE_MS
        ) {
            remoteAccessLogger.error(`NO PINGS RECEIVED IN 1 MINUTE, REMOTE ACCESS MUST BE DISABLED`);
            store.dispatch(setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED));
        }
    }

    start() {
        if (!this.isRunning) {
            this.cronJob.start();
            this.isRunning = true;
        }
    }

    stop() {
        if (this.isRunning) {
            this.cronJob.stop();
            this.isRunning = false;
        }
    }

    isJobRunning(): boolean {
        return this.isRunning;
    }
}

let pingTimeoutJobs: PingTimeoutJobs | null = null;

export const initPingTimeoutJobs = (): boolean => {
    if (!pingTimeoutJobs) {
        pingTimeoutJobs = new PingTimeoutJobs();
    }
    pingTimeoutJobs.start();
    return pingTimeoutJobs.isJobRunning();
};

export const stopPingTimeoutJobs = () => {
    minigraphLogger.trace('Stopping Ping Timeout Jobs');
    if (!pingTimeoutJobs) {
        minigraphLogger.warn('PingTimeoutJobs Handler not found.');
        return;
    }
    pingTimeoutJobs.stop();
    pingTimeoutJobs = null;
};
