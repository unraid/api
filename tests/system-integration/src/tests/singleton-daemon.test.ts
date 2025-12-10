import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { remoteExec } from '../helpers/ssh.js';
import {
    getRemotePid,
    pidFileExists,
    isProcessRunning,
    countNodemonProcesses,
    assertSingleApiInstance,
    assertNoApiProcesses,
    REMOTE_PID_PATH,
} from '../helpers/process.js';
import { cleanup, startApi, stopApi, getStatus, waitForStart } from '../helpers/api-lifecycle.js';
import { rebootServer, waitForServerOffline, waitForServerOnline } from '../helpers/server.js';
import { TEN_SECONDS, ONE_MINUTE, FIFTEEN_MINUTES } from '../helpers/utils.js';

describe('singleton daemon', () => {
    beforeAll(async () => {
        if (!process.env.SERVER) {
            throw new Error('SERVER environment variable must be set');
        }
    });

    afterAll(async () => {
        await cleanup();
        await startApi();
    });

    beforeEach(async () => {
        await cleanup();
    });

    describe('start command', () => {
        it('creates a single process with PID file', async () => {
            await startApi();

            expect(await pidFileExists()).toBe(true);

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();
            expect(pid).toMatch(/^\d+$/);

            expect(await isProcessRunning(pid)).toBe(true);

            await assertSingleApiInstance();
        });

        it('second start does not create duplicate process', async () => {
            await startApi();

            const initialPid = await getRemotePid();
            expect(initialPid).toBeTruthy();

            await assertSingleApiInstance();

            await remoteExec('unraid-api start');

            await new Promise((resolve) => setTimeout(resolve, 2000));

            await assertSingleApiInstance();

            expect(await pidFileExists()).toBe(true);

            const finalPid = await getRemotePid();
            expect(finalPid).toBeTruthy();

            expect(await isProcessRunning(finalPid)).toBe(true);
        });

        it('cleans up stale PID file', async () => {
            await remoteExec(`mkdir -p /var/run/unraid-api && echo '99999' > '${REMOTE_PID_PATH}'`);

            await startApi();

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();
            expect(pid).not.toBe('99999');

            expect(await isProcessRunning(pid)).toBe(true);
        });

        it('cleans up orphaned nodemon process', async () => {
            await startApi();

            await remoteExec(`rm -f '${REMOTE_PID_PATH}'`);

            const count = await countNodemonProcesses();
            expect(count).toBe(1);

            await startApi();

            const newCount = await countNodemonProcesses();
            expect(newCount).toBe(1);

            expect(await pidFileExists()).toBe(true);
        });
    });

    describe('status command', () => {
        it('reports running when API is active', async () => {
            await startApi();

            const output = await getStatus();
            expect(output).toMatch(/running/i);
        });

        it('reports not running when API is stopped', async () => {
            const output = await getStatus();
            expect(output).toMatch(/not running/i);
        });
    });

    describe('stop command', () => {
        it('cleanly terminates all processes', async () => {
            await startApi();

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();

            await assertSingleApiInstance();

            await stopApi();

            expect(await pidFileExists()).toBe(false);

            await assertNoApiProcesses();
        });

        it('stop --force terminates all processes immediately', async () => {
            await startApi();

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();

            await assertSingleApiInstance();

            await stopApi(true);

            expect(await pidFileExists()).toBe(false);

            await assertNoApiProcesses();
        });
    });

    describe('restart command', () => {
        it('creates new process when already running', async () => {
            await startApi();

            const initialPid = await getRemotePid();
            expect(initialPid).toBeTruthy();

            await assertSingleApiInstance();

            await remoteExec('unraid-api restart');

            await new Promise((resolve) => setTimeout(resolve, 3000));
            await waitForStart(TEN_SECONDS);

            const newPid = await getRemotePid();
            expect(newPid).toBeTruthy();

            expect(initialPid).not.toBe(newPid);

            await assertSingleApiInstance();
        });

        it('works when API is not running', async () => {
            await remoteExec('unraid-api restart');

            await waitForStart(TEN_SECONDS);

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();

            expect(await isProcessRunning(pid)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('concurrent starts result in single process', async () => {
            await remoteExec('unraid-api start & unraid-api start & wait');

            await new Promise((resolve) => setTimeout(resolve, 3000));

            await assertSingleApiInstance();

            expect(await pidFileExists()).toBe(true);
        });

        it('API recovers after process is killed externally', async () => {
            await startApi();

            const pid = await getRemotePid();
            expect(pid).toBeTruthy();

            await remoteExec(`kill -9 '${pid}'`);

            await new Promise((resolve) => setTimeout(resolve, 1000));

            await startApi();

            const newPid = await getRemotePid();
            expect(newPid).toBeTruthy();

            expect(await isProcessRunning(newPid)).toBe(true);
        });
    });

    describe('server reboot', () => {
        it(
            'API starts automatically after server reboot',
            async () => {
                await startApi();
                await assertSingleApiInstance();

                await rebootServer();

                const offline = await waitForServerOffline();
                expect(offline).toBe(true);

                const online = await waitForServerOnline();
                expect(online).toBe(true);

                const started = await waitForStart(ONE_MINUTE);
                expect(started).toBe(true);

                await assertSingleApiInstance();

                const status = await getStatus();
                expect(status).toMatch(/running/i);
            },
            FIFTEEN_MINUTES
        );
    });
});
