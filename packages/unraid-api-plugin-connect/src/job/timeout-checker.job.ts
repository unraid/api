import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { isDefined } from 'class-validator';

import { MinigraphStatus } from '../model/connect-config.model.js';
import { ONE_MINUTE_MS, THREE_MINUTES_MS } from '../helper/generic-consts.js';
import { DynamicRemoteAccessService } from '../service/dynamic-remote-access.service.js';
import { MothershipConnectionService } from '../service/connection.service.js';
import { MothershipSubscriptionHandler } from '../service/mothership-subscription.handler.js';

@Injectable()
export class TimeoutCheckerJob {
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly subscriptionHandler: MothershipSubscriptionHandler,
        private schedulerRegistry: SchedulerRegistry,
        private readonly dynamicRemoteAccess: DynamicRemoteAccessService
    ) {}

    public jobName = 'connect-timeout-checker';
    private readonly logger = new Logger(TimeoutCheckerJob.name);

    private hasMothershipClientTimedOut() {
        const { lastPing, status } = this.connectionService.getConnectionState() ?? {};
        return (
            status === MinigraphStatus.CONNECTED && lastPing && Date.now() - lastPing > THREE_MINUTES_MS
        );
    }

    private checkMothershipClientTimeout() {
        if (this.hasMothershipClientTimedOut()) {
            const minutes = this.msToMinutes(THREE_MINUTES_MS);
            this.logger.warn(`NO PINGS RECEIVED IN ${minutes} MINUTES, SOCKET MUST BE RECONNECTED`);
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.PING_FAILURE,
                error: 'Ping Receive Exceeded Timeout',
            });
        }
    }

    private msToMinutes(ms: number) {
        return ms / 1000 / 60;
    }

    async checkForTimeouts() {
        this.subscriptionHandler.clearStaleSubscriptions({ maxAgeMs: THREE_MINUTES_MS });
        this.checkMothershipClientTimeout();
        await this.dynamicRemoteAccess.checkForTimeout();
    }

    start() {
        this.stop();
        const callback = () => this.checkForTimeouts();
        const interval = setInterval(callback, ONE_MINUTE_MS);
        this.schedulerRegistry.addInterval(this.jobName, interval);
    }

    stop() {
        if (!this.isJobRegistered()) {
            this.logger.debug('Stop called before TimeoutCheckerJob was registered. Ignoring.');
            return;
        }
        const interval = this.schedulerRegistry.getInterval(this.jobName);
        if (isDefined(interval)) {
            clearInterval(interval);
            this.schedulerRegistry.deleteInterval(this.jobName);
        }
    }

    isJobRunning() {
        return this.isJobRegistered() && isDefined(this.schedulerRegistry.getInterval(this.jobName));
    }

    isJobRegistered() {
        this.logger.verbose('isJobRegistered?');
        return this.schedulerRegistry.doesExist('interval', this.jobName);
    }
}
