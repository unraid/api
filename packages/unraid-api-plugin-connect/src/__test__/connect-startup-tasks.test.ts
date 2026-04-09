import { describe, expect, it, vi } from 'vitest';

import { MothershipController } from '../mothership-proxy/mothership.controller.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
import {
    ConnectStartupTasksListener,
    scheduleConnectStartupTasks,
} from '../startup/connect-startup-tasks.js';

describe('scheduleConnectStartupTasks', () => {
    it('schedules connect startup work after the provided delay', async () => {
        vi.useFakeTimers();

        const initRemoteAccess = vi.fn().mockResolvedValue(undefined);
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        scheduleConnectStartupTasks(
            {
                dynamicRemoteAccessService: { initRemoteAccess },
                mothershipController: { initOrRestart },
            },
            logger,
            250
        );

        expect(initRemoteAccess).not.toHaveBeenCalled();
        expect(initOrRestart).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(250);

        expect(initRemoteAccess).toHaveBeenCalledTimes(1);
        expect(initOrRestart).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it('warns when a background connect startup task rejects', async () => {
        vi.useFakeTimers();

        const backgroundError = new Error('network unavailable');
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        scheduleConnectStartupTasks(
            {
                dynamicRemoteAccessService: {
                    initRemoteAccess: vi.fn().mockRejectedValue(backgroundError),
                },
            },
            logger,
            250
        );

        await vi.advanceTimersByTimeAsync(250);
        await vi.runAllTicks();

        expect(logger.warn).toHaveBeenCalledWith(
            'Dynamic remote access startup failed',
            backgroundError
        );

        vi.useRealTimers();
    });

    it('does nothing when connect providers are unavailable', () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        expect(() => scheduleConnectStartupTasks({}, logger)).not.toThrow();
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});

describe('ConnectStartupTasksListener', () => {
    it('schedules connect startup work when the app ready event is emitted', async () => {
        vi.useFakeTimers();

        const initRemoteAccess = vi.fn().mockResolvedValue(undefined);
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const listener = new ConnectStartupTasksListener({ initRemoteAccess }, { initOrRestart });
        const event = {
            reason: 'nestjs-server-listening',
        } as const;

        listener.handleAppReady(event);

        await vi.advanceTimersByTimeAsync(0);

        expect(initRemoteAccess).toHaveBeenCalledTimes(1);
        expect(initOrRestart).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
