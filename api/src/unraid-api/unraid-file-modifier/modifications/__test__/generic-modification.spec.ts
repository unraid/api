import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, test, vi } from 'vitest';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';
import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification.js';
import ConnectCertificateProvisioningModification from '@app/unraid-api/unraid-file-modifier/modifications/connect-certificate-provisioning.modification.js';
import ConnectCertificateSettingsModification from '@app/unraid-api/unraid-file-modifier/modifications/connect-certificate-settings.modification.js';
import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification.js';
import DisplaySettingsModification from '@app/unraid-api/unraid-file-modifier/modifications/display-settings.modification.js';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification.js';
import RcNginxModification from '@app/unraid-api/unraid-file-modifier/modifications/rc-nginx.modification.js';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification.js';
import ConnectTunnelNginxModification from '@app/unraid-api/unraid-file-modifier/modifications/zz-connect-tunnel-nginx.modification.js';

interface ModificationTestCase {
    ModificationClass: new (...args: ConstructorParameters<typeof FileModification>) => FileModification;
    fileUrl: string;
    fileName: string;
}

const getPathToFixture = (fileName: string) =>
    resolve(dirname(fileURLToPath(import.meta.url)), `__fixtures__/downloaded/${fileName}`);

/** Modifications that patch the content of an existing file in one or more places. */
const patchTestCases: ModificationTestCase[] = [
    {
        ModificationClass: DefaultPageLayoutModification,
        fileUrl:
            'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/emhttp/plugins/dynamix/include/DefaultPageLayout.php',
        fileName: 'DefaultPageLayout.php',
    },
    {
        ModificationClass: NotificationsPageModification,
        fileUrl:
            'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/emhttp/plugins/dynamix/Notifications.page',
        fileName: 'Notifications.page',
    },
    {
        ModificationClass: DisplaySettingsModification,
        fileUrl:
            'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/emhttp/plugins/dynamix/DisplaySettings.page',
        fileName: 'DisplaySettings.page',
    },
    {
        ModificationClass: SSOFileModification,
        fileUrl:
            'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/emhttp/plugins/dynamix/include/.login.php',
        fileName: '.login.php',
    },
    {
        ModificationClass: AuthRequestModification,
        fileUrl:
            'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/emhttp/auth-request.php',
        fileName: 'auth-request.php',
    },
    {
        ModificationClass: RcNginxModification,
        fileUrl: 'https://raw.githubusercontent.com/unraid/webgui/refs/heads/7.1/etc/rc.d/rc.nginx',
        fileName: 'rc.nginx',
    },
];

/** Modifications that simply add a new file & remove it on rollback. */
const simpleTestCases: ModificationTestCase[] = [];

async function testModification(testCase: ModificationTestCase) {
    const fileName = basename(testCase.fileUrl);
    const filePath = getPathToFixture(fileName);
    const originalContent = await readFile(filePath, 'utf-8').catch(() => '');
    const logger = new Logger();
    const patcher = await new testCase.ModificationClass(logger);
    const originalPath = patcher.filePath;
    // @ts-expect-error - Ignore for testing purposes
    patcher.filePath = filePath;

    // @ts-expect-error - Ignore for testing purposes
    const patch = await patcher.generatePatch(originalPath);

    // Test patch matches snapshot
    await expect(patch).toMatchFileSnapshot(`../patches/${patcher.id}.patch`);

    // Apply patch and verify modified file
    await patcher.apply();
    let snapshotFile = `snapshots/${fileName}.modified.snapshot`;
    if (fileName.endsWith('.php') || fileName.endsWith('.page')) {
        snapshotFile += '.php';
    }
    await expect(await readFile(filePath, 'utf-8')).toMatchFileSnapshot(snapshotFile);

    // Rollback and verify original state
    await patcher.rollback();
    const revertedContent = await readFile(filePath, 'utf-8').catch(() => '');
    await expect(revertedContent).toMatch(originalContent);
}

async function testInvalidModification(testCase: ModificationTestCase) {
    const mockLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        verbose: vi.fn(),
    };

    const patcher = new testCase.ModificationClass(mockLogger as unknown as Logger);

    // @ts-expect-error - Testing invalid pregenerated patches
    patcher.getPregeneratedPatch = vi.fn().mockResolvedValue('I AM NOT A VALID PATCH');

    const filePath = getPathToFixture(testCase.fileName);

    // @ts-expect-error - Testing invalid pregenerated patches
    patcher.filePath = filePath;
    await patcher.apply();

    expect(mockLogger.error.mock.calls[0][0]).toContain(`Failed to apply static patch to ${filePath}`);

    expect(mockLogger.error.mock.calls.length).toBe(1);
    await patcher.rollback();
}

const allTestCases = [...patchTestCases, ...simpleTestCases];

describe('File modifications', () => {
    test.each(allTestCases)(
        `$fileName modifier correctly applies to fresh install`,
        async (testCase) => {
            await testModification(testCase);
        }
    );

    test.each(patchTestCases)(
        `$fileName modifier correctly handles invalid content`,
        async (testCase) => {
            await testInvalidModification(testCase);
        }
    );
});

const connectCases = [
    {
        Class: ConnectCertificateProvisioningModification,
        fixture: 'connect/ProvisionCert.php',
        marker: 'http_response_code(409)',
        removed: 'provisionwildcard',
    },
    {
        Class: ConnectCertificateSettingsModification,
        fixture: 'connect/ManagementAccess.page',
        marker: '/Settings/ConnectTunnel',
        removed: 'name="changePorts" value="Delete"',
    },
    {
        Class: ConnectTunnelNginxModification,
        fixture: 'downloaded/rc.nginx',
        marker: 'SERVER_NAMES+=("$CONNECT_TUNNEL_HOST")',
        removed: null,
    },
];

describe('Connect install patches', () => {
    test.each(connectCases)(
        '$fixture applies only with Connect, survives restart, and rolls back exactly',
        async ({ Class, fixture, marker, removed }) => {
            const directory = await mkdtemp(resolve(tmpdir(), 'connect-patch-'));
            const original = await readFile(
                resolve(import.meta.dirname, '__fixtures__', fixture),
                'utf8'
            );
            const config = new ConfigService({ api: { plugins: [] } });
            const patcher = new Class(new Logger(), config);
            const targetPath = patcher.filePath;
            patcher.filePath = resolve(directory, 'target');
            try {
                await writeFile(patcher.filePath, original);
                expect((await patcher.shouldApply()).shouldApply).toBe(false);
                config.set('api.plugins', ['unraid-api-plugin-connect']);
                expect((await patcher.shouldApply()).shouldApply).toBe(true);
                // @ts-expect-error Verify the generator as well as the shipped patch.
                const generated: string = await patcher.generatePatch(targetPath);
                await expect(generated).toMatchFileSnapshot(`../patches/${patcher.id}.patch`);
                const patch = await patcher.apply();
                await expect(patch.replaceAll(patcher.filePath, targetPath)).toMatchFileSnapshot(
                    `../patches/${patcher.id}.patch`
                );
                const modified = await readFile(patcher.filePath, 'utf8');
                expect(modified).toContain(marker);
                if (removed) expect(modified).not.toContain(removed);
                if (Class === ConnectTunnelNginxModification)
                    execFileSync('bash', ['-n', patcher.filePath]);
                await patcher.apply();
                expect(await readFile(patcher.filePath, 'utf8')).toBe(modified);
                await patcher.rollback();
                expect(await readFile(patcher.filePath, 'utf8')).toBe(original);
            } finally {
                await rm(directory, { recursive: true, force: true });
            }
        }
    );
    test('nginx upgrades the installed single-alias patch and removes it on rollback', async () => {
        const directory = await mkdtemp(resolve(tmpdir(), 'connect-nginx-upgrade-'));
        const path = resolve(directory, 'rc.nginx');
        const original = await readFile(getPathToFixture('rc.nginx'), 'utf8');
        const config = new ConfigService({ api: { plugins: ['unraid-api-plugin-connect'] } });
        const patcher = new ConnectTunnelNginxModification(new Logger(), config);
        patcher.filePath = path;
        const oldPatch = await readFile(
            resolve(import.meta.dirname, '__fixtures__/connect/tunnel-nginx-v1.patch'),
            'utf8'
        );
        const legacy = new ConnectTunnelNginxModification(new Logger(), config);
        legacy.filePath = path;
        // @ts-expect-error Exercise the patch saved by the previous installation.
        legacy.getPregeneratedPatch = async () => oldPatch;
        try {
            await writeFile(path, original);
            await legacy.apply();
            expect(await readFile(path, 'utf8')).not.toContain('tunnelHostnames');
            await patcher.apply();
            expect(await readFile(path, 'utf8')).toContain('tunnelHostnames');
            execFileSync('bash', ['-n', path]);
            await patcher.rollback();
            expect(await readFile(path, 'utf8')).toBe(original);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
    test('nginx patch composes with the older config migration and rolls back in reverse order', async () => {
        const directory = await mkdtemp(resolve(tmpdir(), 'connect-nginx-'));
        const path = resolve(directory, 'rc.nginx');
        const original = await readFile(getPathToFixture('rc.nginx'), 'utf8');
        const old = new RcNginxModification(new Logger());
        const tunnel = new ConnectTunnelNginxModification(new Logger());
        old.filePath = path;
        tunnel.filePath = path;
        try {
            await writeFile(path, original);
            await old.apply();
            await tunnel.apply();
            execFileSync('bash', ['-n', path]);
            expect(await readFile(path, 'utf8')).toContain('check_remote_access');
            await tunnel.rollback();
            await old.rollback();
            expect(await readFile(path, 'utf8')).toBe(original);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
    test.each(connectCases)(
        '$fixture refuses unknown source content without removing it',
        async ({ Class }) => {
            const directory = await mkdtemp(resolve(tmpdir(), 'connect-unknown-'));
            const patcher = new Class(new Logger());
            patcher.filePath = resolve(directory, 'target');
            try {
                await writeFile(patcher.filePath, 'unrecognized input');
                await expect(patcher.apply()).rejects.toThrow();
                expect(await readFile(patcher.filePath, 'utf8')).toBe('unrecognized input');
            } finally {
                await rm(directory, { recursive: true, force: true });
            }
        }
    );
});
