import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { beforeAll, expect, test } from 'vitest';

// Preloading imports for faster tests
import '@app/cli/commands/report';

beforeAll(async () => {
	// Load cfg into store
	await store.dispatch(loadConfigFile());
});

test('anonymise origins removes .sock origins', async () => {
	const { anonymiseOrigins } = await import('@app/cli/commands/report');
	expect(anonymiseOrigins(['/var/run/test.sock'])).toEqual([]);
});

test('anonymise origins hides WAN port', async () => {
	const { anonymiseOrigins } = await import('@app/cli/commands/report');
	expect(anonymiseOrigins(['https://domain.tld:8443'])).toEqual(['https://domain.tld:WANPORT']);
});
