import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { isDefined } from 'class-validator';

import { MinigraphStatus } from '../config.entity.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';

@Injectable()
export class TimeoutCheckerJob {
    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly subscriptionHandler: MothershipSubscriptionHandler,
        private schedulerRegistry: SchedulerRegistry
    ) {}

    public jobName = 'connect-timeout-checker';
    private readonly logger = new Logger(TimeoutCheckerJob.name);
    private THREE_MINUTES_MS = 3 * 60 * 1000;
    private ONE_MINUTE_MS = 60 * 1000;

    private hasMothershipClientTimedOut() {
        const { lastPing, status } = this.connectionService.getConnectionState() ?? {};
        return (
            status === MinigraphStatus.CONNECTED &&
            lastPing &&
            Date.now() - lastPing > this.THREE_MINUTES_MS
        );
    }

    private checkMothershipClientTimeout() {
        if (this.hasMothershipClientTimedOut()) {
            const minutes = this.msToMinutes(this.THREE_MINUTES_MS);
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

    private checkRemoteAccessTimeout() {
        // todo: implement
    }

    async checkForTimeouts() {
        this.subscriptionHandler.clearStaleSubscriptions({ maxAgeMs: this.THREE_MINUTES_MS });
        this.checkMothershipClientTimeout();
        this.checkRemoteAccessTimeout();
    }

    start() {
        this.stop();
        const callback = () => this.checkForTimeouts();
        const interval = setInterval(callback, this.ONE_MINUTE_MS);
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
