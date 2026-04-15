import { describe, expect, it, vi } from 'vitest';

import {
    ConnectStartupTasksListener,
    runConnectStartupTasks,
} from '../startup/connect-startup-tasks.js';

describe('runConnectStartupTasks', () => {
    it('runs connect startup work immediately', async () => {
        const initRemoteAccess = vi.fn().mockResolvedValue(undefined);
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        await runConnectStartupTasks(
            {
                dynamicRemoteAccessService: { initRemoteAccess },
                mothershipController: { initOrRestart },
            },
            logger
        );

        expect(initRemoteAccess).toHaveBeenCalledTimes(1);
        expect(initOrRestart).toHaveBeenCalledTimes(1);
    });

    it('warns when a connect startup task rejects', async () => {
        const backgroundError = new Error('network unavailable');
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        await runConnectStartupTasks(
            {
                dynamicRemoteAccessService: {
                    initRemoteAccess: vi.fn().mockRejectedValue(backgroundError),
                },
            },
            logger
        );

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), backgroundError);
    });

    it('still runs mothership startup when remote access startup rejects', async () => {
        const backgroundError = new Error('network unavailable');
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        await runConnectStartupTasks(
            {
                dynamicRemoteAccessService: {
                    initRemoteAccess: vi.fn().mockRejectedValue(backgroundError),
                },
                mothershipController: { initOrRestart },
            },
            logger
        );

        expect(initOrRestart).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), backgroundError);
    });

    it('does nothing when connect providers are unavailable', async () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        await expect(runConnectStartupTasks({}, logger)).resolves.toBeUndefined();
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});

describe('ConnectStartupTasksListener', () => {
    it('runs connect startup work when the app ready event is emitted', async () => {
        const initRemoteAccess = vi.fn().mockResolvedValue(undefined);
        const initOrRestart = vi.fn().mockResolvedValue(undefined);
        const listener = new ConnectStartupTasksListener({ initRemoteAccess }, { initOrRestart });
        const event = {
            reason: 'nestjs-server-listening',
        } as const;

        await listener.handleAppReady(event);

        expect(initRemoteAccess).toHaveBeenCalledTimes(1);
        expect(initOrRestart).toHaveBeenCalledTimes(1);
    });
});
