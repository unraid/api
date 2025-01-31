import { Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';



import { applyPatch } from 'diff';
import { describe, expect, test } from 'vitest';



import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification';





describe('DefaultPageLayout.php modifier', () => {
    test('correctly applies to fresh install', async () => {
        const fileContent = await readFile(
            resolve(__dirname, '../__fixtures__/DefaultPageLayout.php'),
            'utf-8'
        );
        const path = resolve(__dirname, '../__fixtures__/DefaultPageLayout.php');
        expect(fileContent.length).toBeGreaterThan(0);
        const logger = new Logger();
        const patcher = await new DefaultPageLayoutModification(logger);
        patcher.filePath = path;
        const patch = await patcher.generatePatch();

        await expect(patch.patch).toMatchFileSnapshot('DefaultPageLayout.patch.php');
        // Now we need to apply the patch

        const newContent = applyPatch(fileContent, patch.patch, {
            fuzzFactor: 1,
        });
        await expect(newContent).toMatchFileSnapshot('DefaultPageLayout.modified.php');

        // Now apply the patch
        await patcher.apply();

        // Now rollback the patch and check that the file is back to the original
        await patcher.rollback();
        const revertedContent = await readFile(path, 'utf-8');
        await expect(revertedContent).toMatchFileSnapshot('DefaultPageLayout.original.php');
    });
});