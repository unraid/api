import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { describe, expect, test } from 'vitest';

import DefaultPageLayoutModification from '../default-page-layout.modification';

describe('DefaultPageLayout.php modifier', () => {
    test('correctly applies to fresh install', async () => {
        const fileContent = await readFile(
            resolve(__dirname, '../__fixtures__/DefaultPageLayout.php'),
            'utf-8'
        );
        expect(fileContent.length).toBeGreaterThan(0);
        await expect(DefaultPageLayoutModification.applyToSource(fileContent)).toMatchFileSnapshot(
            'DefaultPageLayout.modified.php'
        );
    });
});
