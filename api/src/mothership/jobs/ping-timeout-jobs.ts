import { KEEP_ALIVE_INTERVAL_MS, TEN_MINUTES_MS } from '@app/consts';
import { minigraphLogger, mothershipLogger, remoteAccessLogger } from '@app/core/log';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { store } from '@app/store/index';
import { setRemoteAccessRunningType } from '@app/store/modules/dynamic-remote-access';
import { clearSubscription } from '@app/store/modules/remote-graphql';
import { Cron, Expression, Initializer } from '@reflet/cron';

export class PingTimeoutJobs extends Initializer<typeof PingTimeoutJobs> {
    @Cron.PreventOverlap
    @Cron(Expression.EVERY_MINUTE)
    @Cron.Start
    async checkForPingTimeouts() {
        const state = store.getState()
        if (!isAPIStateDataFullyLoaded(state)) {
            mothershipLogger.warn(
                'State data not fully loaded, but job has been started'
            );
            return;
        }
        mothershipLogger.debug('Checking for ping timeouts');

        // Check for ping timeouts in remote graphql events
        const subscriptionsToClear = state.remoteGraphQL.subscriptions.filter(
            (subscription) =>
                Date.now() - subscription.lastPing > KEEP_ALIVE_INTERVAL_MS
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

        subscriptionsToClear.forEach((sub) =>
            store.dispatch(clearSubscription(sub.sha256))
        );

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
            Date.now() - state.minigraph.selfDisconnectedSince >
                KEEP_ALIVE_INTERVAL_MS &&
            state.minigraph.status === MinigraphStatus.CONNECTED
        ) {
            minigraphLogger.error(
                `SELF DISCONNECTION EVENT NEVER CLEARED, SOCKET MUST BE RECONNECTED`
            );
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.PING_FAILURE,
                    error: 'Received disconnect event for own server',
                })
            );
        }

        // Check for ping timeouts in remote access
        if (state.dynamicRemoteAccess.lastPing && Date.now() - state.dynamicRemoteAccess.lastPing > TEN_MINUTES_MS) {
            remoteAccessLogger.warn(`No pings received in ${TEN_MINUTES_MS / 1_000 / 60} minutes, stopping Dynamic Remote Access`);
            store.dispatch(setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED));
            
        }
    }
}
