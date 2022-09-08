import { expect, test } from 'vitest';

test('anonymise origins removes .sock origins', async () => {
	const { anonymiseOrigins } = await import('../../../../cli/commands/report');
	expect(anonymiseOrigins(['/var/run/test.sock'])).toEqual([]);
});

test('anonymise origins hides WAN port', async () => {
	const { anonymiseOrigins } = await import('../../../../cli/commands/report');
	expect(anonymiseOrigins(['https://domain.tld:8443'])).toEqual(['https://domain.tld:WANPORT']);
});
