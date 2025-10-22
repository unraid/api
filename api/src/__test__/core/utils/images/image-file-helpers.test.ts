import { expect, test } from 'vitest';

import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';
import { loadDynamixConfig } from '@app/store/index.js';

test('get case path returns expected result', async () => {
    await expect(getCasePathIfPresent()).resolves.toContain('/dev/dynamix/case-model.png');
});

test('get banner path returns the banner (state loaded)', async () => {
    loadDynamixConfig();
    await expect(getBannerPathIfPresent()).resolves.toContain('/dev/dynamix/banner.png');
});

test('get banner path returns null when no banner (state loaded)', async () => {
    loadDynamixConfig();
    await expect(getBannerPathIfPresent('notabanner.png')).resolves.toMatchInlineSnapshot('null');
});
