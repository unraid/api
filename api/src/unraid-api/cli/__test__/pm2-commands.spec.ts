import { describe, expect, it, vi } from 'vitest';

import { ECOSYSTEM_PATH } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { StartCommand } from '@app/unraid-api/cli/start.command.js';
import { StatusCommand } from '@app/unraid-api/cli/status.command.js';
import { StopCommand } from '@app/unraid-api/cli/stop.command.js';

const createLogger = (): LogService =>
    ({
        trace: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }) as unknown as LogService;

const createPm2Service = () =>
    ({
        run: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
        ensurePm2Dependencies: vi.fn().mockResolvedValue(undefined),
        deleteDump: vi.fn().mockResolvedValue(undefined),
        deletePm2Home: vi.fn().mockResolvedValue(undefined),
        forceKillPm2Daemon: vi.fn().mockResolvedValue(undefined),
    }) as unknown as PM2Service;

describe('PM2-backed CLI commands', () => {
    it('start clears PM2 state and starts with mini-list output', async () => {
        const logger = createLogger();
        const pm2 = createPm2Service();
        const command = new StartCommand(logger, pm2);

        await command.run([], { logLevel: 'info' });

        expect(pm2.ensurePm2Dependencies).toHaveBeenCalledTimes(1);
        expect(pm2.deleteDump).toHaveBeenCalledTimes(1);
        expect(pm2.deletePm2Home).toHaveBeenCalledTimes(1);
        expect(pm2.run).toHaveBeenNthCalledWith(1, { tag: 'PM2 Stop' }, 'stop', ECOSYSTEM_PATH);
        expect(pm2.run).toHaveBeenNthCalledWith(2, { tag: 'PM2 Update' }, 'update');
        expect(pm2.run).toHaveBeenNthCalledWith(3, { tag: 'PM2 Delete' }, 'delete', ECOSYSTEM_PATH);
        expect(pm2.run).toHaveBeenNthCalledWith(4, { tag: 'PM2 Kill' }, 'kill', '--no-autorestart');
        expect(pm2.run).toHaveBeenNthCalledWith(
            5,
            { tag: 'PM2 Start', raw: true, extendEnv: true, env: { LOG_LEVEL: 'info' } },
            'start',
            ECOSYSTEM_PATH,
            '--update-env',
            '--mini-list'
        );
    });

    it('restart uses mini-list output for the PM2 restart call', async () => {
        const logger = createLogger();
        const pm2 = createPm2Service();
        const command = new RestartCommand(logger, pm2);

        await command.run([], { logLevel: 'info' });

        expect(pm2.run).toHaveBeenCalledWith(
            { tag: 'PM2 Restart', raw: true, extendEnv: true, env: { LOG_LEVEL: 'info' } },
            'restart',
            ECOSYSTEM_PATH,
            '--update-env',
            '--mini-list'
        );
    });

    it('status uses mini-list output for the PM2 status call', async () => {
        const pm2 = createPm2Service();
        const command = new StatusCommand(pm2);

        await command.run();

        expect(pm2.run).toHaveBeenCalledWith(
            { tag: 'PM2 Status', stdio: 'inherit', raw: true },
            'status',
            'unraid-api',
            '--mini-list'
        );
    });

    it('stop uses mini-list output for the PM2 delete call', async () => {
        const pm2 = createPm2Service();
        const command = new StopCommand(pm2);

        await command.run([], { delete: false });

        expect(pm2.run).toHaveBeenCalledWith(
            { tag: 'PM2 Delete', stdio: 'inherit' },
            'delete',
            ECOSYSTEM_PATH,
            '--no-autorestart',
            '--mini-list'
        );
    });
});
