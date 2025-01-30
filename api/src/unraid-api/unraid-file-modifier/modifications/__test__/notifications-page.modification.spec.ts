import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { describe, expect, test } from 'vitest';

import NotificationsPageModification from '../notifications-page.modification';

describe('Notifications.page modifier', () => {
    test('correctly applies to fresh install', async () => {
        const fileContent = await readFile(
            resolve(__dirname, '../__fixtures__/Notifications.page'),
            'utf-8'
        );
        expect(fileContent.length).toBeGreaterThan(0);
        await expect(NotificationsPageModification.applyToSource(fileContent)).toMatchFileSnapshot(
            'Notifications.modified.page'
        );
    });
});
