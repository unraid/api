import { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { afterEach } from 'node:test';
import { basename, resolve } from 'path';

import { describe, expect, test, vi } from 'vitest';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification';
import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification';
import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification';
import { LogRotateModification } from '@app/unraid-api/unraid-file-modifier/modifications/log-rotate.modification';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification';

interface ModificationTestCase {
    ModificationClass: new (...args: ConstructorParameters<typeof FileModification>) => FileModification;
    fileUrl: string;
    fileName: string;
}

const getPathToFixture = (fileName: string) => resolve(__dirname, `__fixtures__/downloaded/${fileName}`);
const testCases: ModificationTestCase[] = [
    {
        ModificationClass: DefaultPageLayoutModification,
        fileUrl:
            'https://github.com/unraid/webgui/raw/refs/heads/master/emhttp/plugins/dynamix/include/DefaultPageLayout.php',
        fileName: 'DefaultPageLayout.php',
    },
    {
        ModificationClass: NotificationsPageModification,
        fileUrl:
            'https://github.com/unraid/webgui/raw/refs/heads/master/emhttp/plugins/dynamix/Notifications.page',
        fileName: 'Notifications.page',
    },
    {
        fileUrl:
            'https://github.com/unraid/webgui/raw/refs/heads/master/emhttp/plugins/dynamix/include/.login.php',
        ModificationClass: SSOFileModification,
        fileName: '.login.php',
    },
    {
        ModificationClass: AuthRequestModification,
        fileUrl: 'https://github.com/unraid/webgui/raw/refs/heads/master/emhttp/auth-request.php',
        fileName: 'auth-request.php',
    },
    {
        ModificationClass: LogRotateModification,
        fileUrl: 'logrotate.conf',
        fileName: 'logrotate.conf',
    },
];

const downloadOrRetrieveOriginalFile = async (filePath: string, fileUrl: string): Promise<string> => {
    let originalContent = '';
    // Check last download time, if > than 1 week and not in CI, download the file from Github
    const lastDownloadTime = await readFile(`${filePath}.last-download-time`, 'utf-8')
        .catch(() => 0)
        .then(Number);
    const shouldDownload = lastDownloadTime < Date.now() - 1000 * 60 * 60 * 24 * 7 && !process.env.CI;
    if (shouldDownload) {
        try {
            console.log('Downloading file', fileUrl);
            originalContent = await fetch(fileUrl).then((response) => response.text());
            if (!originalContent) {
                throw new Error('Failed to download file');
            }
            await writeFile(filePath, originalContent);
            await writeFile(`${filePath}.last-download-time`, Date.now().toString());
            return originalContent;
        } catch (error) {
            console.error('Error downloading file', error);
            console.error(
                `Failed to download file - using version created at ${new Date(lastDownloadTime).toISOString()}`
            );
        }
    }
    return await readFile(filePath, 'utf-8');
};

async function testModification(testCase: ModificationTestCase, patcher: FileModification) {
    const fileName = basename(testCase.fileUrl);
    const filePath = getPathToFixture(fileName);
    const originalContent = await downloadOrRetrieveOriginalFile(filePath, testCase.fileUrl);
    const logger = new Logger();
    patcher = await new testCase.ModificationClass(logger);
    const originalPath = patcher.filePath;
    // @ts-expect-error - Ignore for testing purposes
    patcher.filePath = filePath;

    // @ts-expect-error - Ignore for testing purposes
    const patch = await patcher.generatePatch(originalPath);

    // Test patch matches snapshot
    await expect(patch).toMatchFileSnapshot(`../patches/${patcher.id}.patch`);

    // Apply patch and verify modified file
    await patcher.apply();
    await expect(await readFile(filePath, 'utf-8')).toMatchFileSnapshot(
        `snapshots/${fileName}.modified.snapshot.php`
    );

    // Rollback and verify original state
    await patcher.rollback();
    const revertedContent = await readFile(filePath, 'utf-8');
    await expect(revertedContent).toMatch(originalContent);
}

async function testInvalidModification(testCase: ModificationTestCase, patcher: FileModification) {
    const mockLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        verbose: vi.fn(),
    };

    patcher = new testCase.ModificationClass(mockLogger as unknown as Logger);

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

describe('File modifications', () => {
    let patcher: FileModification;

    test.each(testCases)(`$fileName modifier correctly applies to fresh install`, async (testCase) => {
        await testModification(testCase, patcher);
    });

    test.each(testCases)(`$fileName modifier correctly handles invalid content`, async (testCase) => {
        await testInvalidModification(testCase, patcher);
    });

    afterEach(async () => {
        await patcher?.rollback();
    });
});
