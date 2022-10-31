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
	expect(dns).toMatchInlineSnapshot(`
		{
		  "cloudIp": "93.184.216.34",
		}
	`);
}, 25_000);

test('testing twice results in a cache hit', async () => {
	// Hit mothership
	const getters = await import('@app/store/getters');
	const dnsSpy = vi.spyOn(getters, 'getDnsCache');
	const dns = await checkDNS();
	expect(dns).toMatchInlineSnapshot(`
		{
		  "cloudIp": "52.40.54.163",
		}
	`);
	expect(dnsSpy.mock.results[0]).toMatchInlineSnapshot(`
		{
		  "type": "return",
		  "value": undefined,
		}
	`);
	const dnslookup2 = await checkDNS();
	expect(dnslookup2).toMatchInlineSnapshot(`
		{
		  "cloudIp": "52.40.54.163",
		}
	`);
	expect(dnsSpy.mock.results[1]).toMatchInlineSnapshot(`
		{
		  "type": "return",
		  "value": {
		    "cloudIp": "52.40.54.163",
		    "error": null,
		  },
		}
	`);
	expect(store.getState().cache.nodeCache.getTtl(CacheKeys.checkDns)).toBeGreaterThan(500);
});
