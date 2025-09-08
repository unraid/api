import { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, test, vi } from 'vitest';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';
import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification.js';
import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification.js';
import DisplaySettingsModification from '@app/unraid-api/unraid-file-modifier/modifications/display-settings.modification.js';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification.js';
import RcNginxModification from '@app/unraid-api/unraid-file-modifier/modifications/rc-nginx.modification.js';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification.js';

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
