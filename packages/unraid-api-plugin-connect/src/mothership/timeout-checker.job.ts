import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { isDefined } from 'class-validator';

import { MinigraphStatus } from '../config.entity.js';
import { ONE_MINUTE_MS, THREE_MINUTES_MS } from '../helpers/consts.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';

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
        const interval = this.schedulerRegistry.getInterval(this.jobName);
        if (isDefined(interval)) {
            clearInterval(interval);
            this.schedulerRegistry.deleteInterval(this.jobName);
        }
    }

    isJobRunning() {
        const interval = this.schedulerRegistry.getInterval(this.jobName) as NodeJS.Timeout | undefined;
        return isDefined(interval);
    }
}
