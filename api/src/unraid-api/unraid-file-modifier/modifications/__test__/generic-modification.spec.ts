import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { cp, readFile, writeFile } from 'fs/promises';
import path, { basename, resolve } from 'path';

import { describe, expect, test } from 'vitest';

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

async function testModification(testCase: ModificationTestCase) {
    const fileName = basename(testCase.fileUrl);
    const filePath = resolve(__dirname, `../__fixtures__/downloaded/${fileName}`);
    const originalContent = await downloadOrRetrieveOriginalFile(filePath, testCase.fileUrl);
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
    await expect(await readFile(filePath, 'utf-8')).toMatchFileSnapshot(
        `snapshots/${fileName}.modified.snapshot.php`
    );

    // Rollback and verify original state
    await patcher.rollback();
    const revertedContent = await readFile(filePath, 'utf-8');
    await expect(revertedContent).toMatch(originalContent);
}

describe('File modifications', () => {
    test.each(testCases)(`$fileName modifier correctly applies to fresh install`, async (testCase) => {
        await testModification(testCase);
    });
});
