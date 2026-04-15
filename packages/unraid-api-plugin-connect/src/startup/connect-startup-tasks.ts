import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MothershipController } from '../mothership-proxy/mothership.controller.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';

const APP_READY_EVENT = 'app.ready';
const DEFAULT_CONNECT_STARTUP_DELAY_MS = 0;

interface AppReadyEvent {
    reason: 'nestjs-server-listening';
}

interface ConnectStartupTasksDependencies {
    dynamicRemoteAccessService?: Pick<DynamicRemoteAccessService, 'initRemoteAccess'> | null;
    mothershipController?: Pick<MothershipController, 'initOrRestart'> | null;
}

interface ConnectStartupLogger {
    log: (message: string) => void;
    warn: (message: string, error: unknown) => void;
}

export const scheduleConnectStartupTasks = (
    { dynamicRemoteAccessService, mothershipController }: ConnectStartupTasksDependencies,
    logger: ConnectStartupLogger,
    delayMs = DEFAULT_CONNECT_STARTUP_DELAY_MS
): void => {
    if (!dynamicRemoteAccessService && !mothershipController) {
        return;
    }

    logger.log(`Scheduling Connect startup tasks to run in ${delayMs}ms`);

    if (dynamicRemoteAccessService) {
        setTimeout(() => {
            void Promise.resolve()
                .then(() => dynamicRemoteAccessService.initRemoteAccess())
                .catch((error: unknown) => {
                    logger.warn('Dynamic remote access startup failed', error);
                });
        }, delayMs);
    }

    if (mothershipController) {
        setTimeout(() => {
            void Promise.resolve()
                .then(() => mothershipController.initOrRestart())
                .catch((error: unknown) => {
                    logger.warn('Mothership startup failed', error);
                });
        }, delayMs);
    }
};

@Injectable()
export class ConnectStartupTasksListener {
    private readonly logger = new Logger(ConnectStartupTasksListener.name);

    constructor(
        @Inject(DynamicRemoteAccessService)
        private readonly dynamicRemoteAccessService: Pick<
            DynamicRemoteAccessService,
            'initRemoteAccess'
        >,
        @Inject(MothershipController)
        private readonly mothershipController: Pick<MothershipController, 'initOrRestart'>
    ) {}

    @OnEvent(APP_READY_EVENT)
    handleAppReady(_event: AppReadyEvent): void {
        scheduleConnectStartupTasks(
            {
                dynamicRemoteAccessService: this.dynamicRemoteAccessService,
                mothershipController: this.mothershipController,
            },
            this.logger
        );
    }
}
