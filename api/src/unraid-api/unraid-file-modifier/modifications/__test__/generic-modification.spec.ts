import { Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';

import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification';
import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification';

interface ModificationTestCase {
    name: string;
    ModificationClass: new (logger: Logger) => FileModification;
    fileName: string;
}

const testCases: ModificationTestCase[] = [
    {
        name: 'DefaultPageLayout.php',
        ModificationClass: DefaultPageLayoutModification,
        fileName: 'DefaultPageLayout.php'
    },
    {
        name: 'Notifications.page',
        ModificationClass: NotificationsPageModification,
        fileName: 'Notifications.page'
    },
    {
        name: '.login.php',
        ModificationClass: SSOFileModification,
        fileName: '.login.php'
    }
];

async function testModification(testCase: ModificationTestCase) {
    const path = resolve(__dirname, `../__fixtures__/${testCase.fileName}`);
    const fileContent = await readFile(path, 'utf-8');
    expect(fileContent.length).toBeGreaterThan(0);

    const logger = new Logger();
    const patcher = await new testCase.ModificationClass(logger);
    // @ts-ignore - Ignore for testing purposes
    patcher.filePath = path;
    
    // @ts-ignore - Ignore for testing purposes
    const patch = await patcher.generatePatch();
    
    // Test patch matches snapshot
    await expect(patch.patch).toMatchFileSnapshot(
        `snapshots/${testCase.fileName}.snapshot.patch`
    );

    // Apply patch and verify modified file
    await patcher.apply();
    await expect(await readFile(path, 'utf-8')).toMatchFileSnapshot(
        `snapshots/${testCase.fileName}.modified.snapshot.php`
    );

    // Rollback and verify original state
    await patcher.rollback();
    const revertedContent = await readFile(path, 'utf-8');
    await expect(revertedContent).toMatchFileSnapshot(
        `snapshots/${testCase.fileName}.original.php`
    );
}

describe('File modifications', () => {
    test.each(testCases)('$name modifier correctly applies to fresh install', async (testCase) => {
        await testModification(testCase);
    });
});
