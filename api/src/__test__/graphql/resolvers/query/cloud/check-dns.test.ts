import { expect, test, vi } from 'vitest';
import { checkDNS } from '@app/graphql/resolvers/query/cloud/check-dns';

test('it resolves dns successfully', async () => {
	// @TODO
	const dns = await checkDNS('example.com');
	// Expect(dns).toMatchInlineSnapshot();
}, 25_000);
