import { beforeAll, expect, test } from 'vitest';

import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { anonymiseOrigins } from '@app/unraid-api/cli/report.command';

beforeAll(async () => {
    // Load cfg into store
    await store.dispatch(loadConfigFile());
});

test('anonymise origins removes .sock origins', async () => {
    expect(anonymiseOrigins(['/var/run/test.sock'])).toEqual([]);
});

test('anonymise origins hides WAN port', async () => {
    expect(anonymiseOrigins(['https://domain.tld:8443'])).toEqual(['https://domain.tld:WANPORT']);
});
