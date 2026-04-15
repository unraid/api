import { Test } from '@nestjs/testing';

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
            log: vi.fn(),
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

    it('warns when a connect startup task rejects', async () => {
        vi.useFakeTimers();

        const backgroundError = new Error('network unavailable');
        const logger = {
            log: vi.fn(),
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

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), backgroundError);

        vi.useRealTimers();
    });

    it('still runs mothership startup when remote access startup rejects', async () => {
        vi.useFakeTimers();

        const backgroundError = new Error('network unavailable');
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const logger = {
            log: vi.fn(),
            warn: vi.fn(),
        };

        scheduleConnectStartupTasks(
            {
                dynamicRemoteAccessService: {
                    initRemoteAccess: vi.fn().mockRejectedValue(backgroundError),
                },
                mothershipController: { initOrRestart },
            },
            logger,
            250
        );

        await vi.advanceTimersByTimeAsync(250);
        await vi.runAllTicks();

        expect(initOrRestart).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), backgroundError);

        vi.useRealTimers();
    });

    it('does nothing when connect providers are unavailable', () => {
        const logger = {
            log: vi.fn(),
            warn: vi.fn(),
        };

        expect(() => scheduleConnectStartupTasks({}, logger)).not.toThrow();
        expect(logger.log).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});

describe('ConnectStartupTasksListener', () => {
    it('schedules connect startup work when the app ready event is emitted', async () => {
        vi.useFakeTimers();

        const initRemoteAccess = vi.fn().mockResolvedValue(undefined);
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const module = await Test.createTestingModule({
            providers: [
                ConnectStartupTasksListener,
                {
                    provide: DynamicRemoteAccessService,
                    useValue: { initRemoteAccess },
                },
                {
                    provide: MothershipController,
                    useValue: { initOrRestart },
                },
            ],
        }).compile();
        const listener = module.get(ConnectStartupTasksListener);
        const event = {
            reason: 'nestjs-server-listening',
        } as const;

        listener.handleAppReady(event);

        await vi.advanceTimersByTimeAsync(0);

        expect(initRemoteAccess).toHaveBeenCalledTimes(1);
        expect(initOrRestart).toHaveBeenCalledTimes(1);

        await module.close();
        vi.useRealTimers();
    });
});
