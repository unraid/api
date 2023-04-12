import { afterEach, expect, test, vi } from 'vitest';
import { checkDNS } from '@app/graphql/resolvers/query/cloud/check-dns';
import { store } from '@app/store';
import { clearKey } from '@app/store/modules/cache';
import { CacheKeys } from '@app/store/types';

afterEach(() => {
	store.dispatch(clearKey(CacheKeys.checkDns));
});

test('it resolves dns successfully', async () => {
	// @TODO
	const dns = await checkDNS('example.com');
	expect(dns.cloudIp).not.toBeNull()
}, 25_000);

test('testing twice results in a cache hit', async () => {
	// Hit mothership
	const getters = await import('@app/store/getters');
	const dnsSpy = vi.spyOn(getters, 'getDnsCache');
	const dns = await checkDNS();
	expect(dns.cloudIp).toBeTypeOf('string')
	expect(dnsSpy.mock.results[0]).toMatchInlineSnapshot(`
		{
		  "type": "return",
		  "value": undefined,
		}
	`);
	const dnslookup2 = await checkDNS();
	expect(dnslookup2.cloudIp).toEqual(dns.cloudIp)
	expect(dnsSpy.mock.results[1].value.cloudIp).toEqual(dns.cloudIp)
	expect(store.getState().cache.nodeCache.getTtl(CacheKeys.checkDns)).toBeGreaterThan(500);
});
