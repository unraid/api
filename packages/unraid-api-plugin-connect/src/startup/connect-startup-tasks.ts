import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MothershipController } from '../mothership-proxy/mothership.controller.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
const APP_READY_EVENT = 'app.ready';

interface AppReadyEvent {
    reason: 'nestjs-server-listening';
}

interface ConnectStartupRemoteAccess {
    initRemoteAccess: () => Promise<void>;
}

interface ConnectStartupMothership {
    initOrRestart: () => Promise<void>;
}

interface ConnectStartupTasksDependencies {
    dynamicRemoteAccessService?: ConnectStartupRemoteAccess | null;
    mothershipController?: ConnectStartupMothership | null;
}

interface ConnectStartupLogger {
    info: (message: string) => void;
    warn: (message: string, error: unknown) => void;
}

export const runConnectStartupTasks = async (
    { dynamicRemoteAccessService, mothershipController }: ConnectStartupTasksDependencies,
    logger: ConnectStartupLogger
): Promise<void> => {
    if (!dynamicRemoteAccessService && !mothershipController) {
        return;
    }

    logger.info('Running Connect startup tasks after app.ready');

    await Promise.allSettled([
        dynamicRemoteAccessService?.initRemoteAccess().catch((error: unknown) => {
                logger.warn('Dynamic remote access startup failed', error);
            }),
        mothershipController?.initOrRestart().catch((error: unknown) => {
                logger.warn('Mothership startup failed', error);
            }),
    ]);
};

@Injectable()
export class ConnectStartupTasksListener {
    private readonly logger = new Logger(ConnectStartupTasksListener.name);

    constructor(
        @Inject(DynamicRemoteAccessService)
        private readonly dynamicRemoteAccessService: ConnectStartupRemoteAccess,
        @Inject(MothershipController)
        private readonly mothershipController: ConnectStartupMothership
    ) {}

    @OnEvent(APP_READY_EVENT, { async: true })
    async handleAppReady(_event: AppReadyEvent): Promise<void> {
        await runConnectStartupTasks(
            {
                dynamicRemoteAccessService: this.dynamicRemoteAccessService,
                mothershipController: this.mothershipController,
            },
            {
                info: (message: string) => this.logger.log(message),
                warn: (message: string, error: unknown) => this.logger.warn(`${message}: ${String(error)}`),
            }
        );
    }
}
