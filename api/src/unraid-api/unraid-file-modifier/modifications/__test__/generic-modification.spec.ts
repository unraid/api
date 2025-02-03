import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { cp, readFile, writeFile } from 'fs/promises';
import { basename, resolve } from 'path';

import { describe, expect, test } from 'vitest';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification';
import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification';
import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification';

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
        fileUrl:
            'https://github.com/unraid/webgui/raw/refs/heads/master/emhttp/auth-request.php',
        fileName: 'auth-request.php',
    },
];

async function testModification(testCase: ModificationTestCase) {
    // First download the file from Github
    const fileName = basename(testCase.fileUrl);

    const path = resolve(__dirname, `../__fixtures__/downloaded/${fileName}`);
    const pathLocal = resolve(__dirname, `../__fixtures__/local/${fileName}`);
    let originalContent = '';
    if (!existsSync(path)) {
        try {
            console.log('Downloading file', testCase.fileUrl);
            originalContent = await fetch(testCase.fileUrl).then((response) => response.text());
            await writeFile(path, originalContent);
            await writeFile(pathLocal, originalContent);
        } catch (error) {
            console.error('Failed to download file - using local fixture', error);
            await cp(resolve(__dirname, `../__fixtures__/local/${fileName}`), path);
            originalContent = await readFile(path, 'utf-8');
        }
    } else {
        console.log('Using existing fixture file', path);
        originalContent = await readFile(path, 'utf-8');
    }

    expect(originalContent.length).toBeGreaterThan(0);

    const logger = new Logger();
    const patcher = await new testCase.ModificationClass(logger);
    // @ts-expect-error - Ignore for testing purposes
    patcher.filePath = path;

    // @ts-expect-error - Ignore for testing purposes
    const patch = await patcher.generatePatch();

    // Test patch matches snapshot
    await expect(patch).toMatchFileSnapshot(`../patches/${patcher.id}.patch`);

    // Apply patch and verify modified file
    await patcher.apply();
    await expect(await readFile(path, 'utf-8')).toMatchFileSnapshot(
        `snapshots/${fileName}.modified.snapshot.php`
    );

    // Rollback and verify original state
    await patcher.rollback();
    const revertedContent = await readFile(path, 'utf-8');
    await expect(revertedContent).toMatch(originalContent);
}

describe('File modifications', () => {
    test.each(testCases)(`$fileName modifier correctly applies to fresh install`, async (testCase) => {
        await testModification(testCase);
    });
});
